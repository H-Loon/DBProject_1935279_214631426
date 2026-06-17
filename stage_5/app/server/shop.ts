/**
 * shop.ts - Customer-facing storefront API.
 *
 * Unlike the admin CRUD, this models a real shopping flow:
 *   browse products -> add to cart -> checkout -> order is created.
 *
 * Checkout runs as a single transaction that inserts the ORDERS row and one
 * ORDER_ITEMS row per cart line. Each ORDER_ITEMS insert fires the Stage-4
 * BEFORE-INSERT trigger, which decrements product stock and aborts the whole
 * order if any item is out of stock — exactly like a real store.
 */
import { Router } from 'express';
import { pool, queryObjects } from './db.ts';

const router = Router();

function cleanErr(e: any): string {
  let msg = e.message || String(e);
  if (e.detail) msg += ` (${e.detail})`;
  return msg;
}

/** Product catalog with category, supplier and average rating. */
router.get('/shop/products', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (search) { params.push(`%${search}%`); where.push(`p.productname ILIKE $${params.length}`); }
    if (category) { params.push(category); where.push(`c.categoryname = $${params.length}`); }
    const rows = await queryObjects(
      `SELECT p.productid, p.productname, p.price, p.stockquantity,
              c.categoryname AS category, s.companyname AS supplier,
              ROUND(AVG(pr.rating), 1) AS avg_rating, COUNT(pr.reviewid) AS review_count
       FROM products p
       JOIN categories c ON p.categoryid = c.categoryid
       JOIN suppliers  s ON p.supplierid = s.supplierid
       LEFT JOIN product_reviews pr ON p.productid = pr.productid
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       GROUP BY p.productid, p.productname, p.price, p.stockquantity, c.categoryname, s.companyname
       ORDER BY review_count DESC, avg_rating DESC NULLS LAST
       LIMIT 60`,
      params,
    );
    res.json({ products: rows });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Categories that actually have products (for the filter bar). */
router.get('/shop/categories', async (_req, res) => {
  try {
    const rows = await queryObjects(
      `SELECT c.categoryname, COUNT(p.productid) AS n
       FROM categories c JOIN products p ON p.categoryid = c.categoryid
       GROUP BY c.categoryname ORDER BY n DESC LIMIT 24`,
    );
    res.json({ categories: rows.map((r) => r.categoryname) });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Customers to "shop as" (no customer auth in this academic app). */
router.get('/shop/customers', async (_req, res) => {
  try {
    const rows = await queryObjects(
      `SELECT customerid, firstname || ' ' || lastname AS name, email
       FROM customers ORDER BY name LIMIT 1000`,
    );
    res.json({ customers: rows });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

router.get('/shop/shippers', async (_req, res) => {
  try {
    const rows = await queryObjects(
      `SELECT shipperid, companyname FROM shippers ORDER BY companyname`,
    );
    res.json({ shippers: rows });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Validate a coupon code -> discount percent + expiry. */
router.post('/shop/coupon', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim();
    if (!code) return res.json({ valid: false });
    const rows = await queryObjects(
      `SELECT couponid, discountpercent, expirydate, expirydate < CURRENT_DATE AS expired
       FROM coupons WHERE couponcode = $1`, [code]);
    if (!rows.length) return res.json({ valid: false, reason: 'No such coupon code.' });
    const c = rows[0];
    if (c.expired) return res.json({ valid: false, reason: 'This coupon has expired.' });
    res.json({ valid: true, couponId: c.couponid, discountPercent: c.discountpercent });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Reviews for one product. */
router.get('/shop/product/:id/reviews', async (req, res) => {
  try {
    const rows = await queryObjects(
      `SELECT pr.rating, pr.comment, pr.reviewdate,
              c.firstname || ' ' || c.lastname AS customer
       FROM product_reviews pr JOIN customers c ON pr.customerid = c.customerid
       WHERE pr.productid = $1 ORDER BY pr.reviewdate DESC LIMIT 50`,
      [Number(req.params.id)]);
    res.json({ reviews: rows });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Leave a product review. */
router.post('/shop/review', async (req, res) => {
  try {
    const { productId, customerId, rating, comment } = req.body || {};
    if (!productId || !customerId || !rating) throw new Error('Product, customer and rating are required.');
    const next = await queryObjects(`SELECT COALESCE(MAX(reviewid),0)+1 AS id FROM product_reviews`);
    await pool.query(
      `INSERT INTO product_reviews (reviewid, rating, comment, reviewdate, productid, customerid)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
      [next[0].id, Number(rating), comment || null, Number(productId), Number(customerId)]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/**
 * Place an order. Body:
 *   { customerId, shipperId, shippingAddress, couponCode?, items: [{productId, quantity}] }
 * Runs in a transaction; the stock trigger may abort it (out of stock).
 */
router.post('/shop/checkout', async (req, res) => {
  const { customerId, shipperId, shippingAddress, couponCode, items } = req.body || {};
  if (!customerId) return res.status(400).json({ error: 'Please choose which customer you are shopping as.' });
  if (!shipperId) return res.status(400).json({ error: 'Please choose a shipping company.' });
  if (!shippingAddress) return res.status(400).json({ error: 'Please enter a shipping address.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oid = (await client.query(`SELECT COALESCE(MAX(orderid),0)+1 AS id FROM orders`)).rows[0].id;
    const empRow = (await client.query(`SELECT employeeid FROM employees ORDER BY random() LIMIT 1`)).rows[0];
    if (!empRow) throw new Error('No employee is available to handle this order.');

    let couponId: number | null = null;
    let discount = 0;
    if (couponCode) {
      const cp = (await client.query(
        `SELECT couponid, discountpercent FROM coupons
         WHERE couponcode = $1 AND expirydate >= CURRENT_DATE`, [couponCode])).rows[0];
      if (cp) { couponId = cp.couponid; discount = cp.discountpercent; }
    }

    await client.query(
      `INSERT INTO orders (orderid, orderdate, shippingaddress, status, shipperid, customerid, couponid, employeeid)
       VALUES ($1, CURRENT_DATE, $2, 'Processing', $3, $4, $5, $6)`,
      [oid, shippingAddress, shipperId, customerId, couponId, empRow.employeeid]);

    let subtotal = 0;
    for (const it of items) {
      const pr = (await client.query(
        `SELECT price, productname FROM products WHERE productid = $1`, [it.productId])).rows[0];
      if (!pr) throw new Error(`Product ${it.productId} no longer exists.`);
      const qty = Math.max(1, Number(it.quantity) || 1);
      // fires trg_order_items_stock_control (decrement stock / reject if short)
      await client.query(
        `INSERT INTO order_items (quantity, unitprice, productid, orderid) VALUES ($1, $2, $3, $4)`,
        [qty, pr.price, it.productId, oid]);
      subtotal += Number(pr.price) * qty;
    }

    await client.query('COMMIT');
    const total = subtotal * (1 - discount / 100);
    res.json({ orderId: oid, subtotal, discountPercent: discount, total, itemCount: items.length });
  } catch (e: any) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    res.status(400).json({ error: cleanErr(e) });
  } finally {
    client.release();
  }
});

/** A customer's order history, enriched (best-effort) with delivery tracking. */
router.get('/shop/orders', async (req, res) => {
  try {
    const customerId = Number(req.query.customerId);
    if (!customerId) return res.json({ orders: [] });
    const orders = await queryObjects(
      `SELECT o.orderid, o.orderdate, o.status, o.shippingaddress,
              sh.companyname AS shipper, cp.discountpercent,
              COALESCE(SUM(oi.quantity * oi.unitprice), 0) AS subtotal,
              COALESCE(SUM(oi.quantity), 0) AS items
       FROM orders o
       JOIN shippers sh ON o.shipperid = sh.shipperid
       LEFT JOIN coupons cp ON o.couponid = cp.couponid
       LEFT JOIN order_items oi ON o.orderid = oi.orderid
       WHERE o.customerid = $1
       GROUP BY o.orderid, o.orderdate, o.status, o.shippingaddress, sh.companyname, cp.discountpercent
       ORDER BY o.orderdate DESC, o.orderid DESC LIMIT 200`,
      [customerId]);

    // integrated delivery tracking (best-effort; remote schema may be offline)
    const ids = orders.map((o) => o.orderid);
    const tracking: Record<number, any> = {};
    if (ids.length) {
      try {
        const d = await queryObjects(
          `SELECT externalorderid, status, actualdeliverydate
           FROM remote_logistics.deliveries WHERE externalorderid = ANY($1)`, [ids]);
        for (const row of d) tracking[row.externalorderid] = row;
      } catch { /* remote offline -> just skip tracking */ }
    }

    const withTotals = orders.map((o) => {
      const disc = o.discountpercent ? Number(o.discountpercent) : 0;
      const total = Number(o.subtotal) * (1 - disc / 100);
      const t = tracking[o.orderid];
      return {
        ...o,
        discountPercent: disc,
        total,
        deliveryStatus: t ? t.status : null,
        deliveredOn: t ? t.actualdeliverydate : null,
      };
    });
    res.json({ orders: withTotals });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

export default router;
