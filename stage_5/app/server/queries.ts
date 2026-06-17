/**
 * queries.ts - Run the Stage-2 SQL queries and the Stage-3 views from the UI.
 * These are read-only and parameterless; results come back as a table.
 */
import { Router } from 'express';
import { query } from './db.ts';

interface NamedQuery { key: string; title: string; desc: string; sql: string; tag: string; }

export const QUERIES: NamedQuery[] = [
  {
    key: 'q1_featured_products', tag: 'Stage 2',
    title: 'Featured products & average rating',
    desc: 'Products with category, supplier and average customer rating (4-table JOIN + AVG + LEFT JOIN).',
    sql: `SELECT p.productname AS product, c.categoryname AS category,
                 s.companyname AS supplier, ROUND(AVG(pr.rating),1) AS avg_rating, p.price
          FROM products p
          JOIN categories c ON p.categoryid = c.categoryid
          JOIN suppliers  s ON p.supplierid = s.supplierid
          LEFT JOIN product_reviews pr ON p.productid = pr.productid
          GROUP BY p.productid, p.productname, c.categoryname, s.companyname, p.price
          ORDER BY avg_rating DESC NULLS LAST`,
  },
  {
    key: 'q2_monthly_revenue', tag: 'Stage 2',
    title: 'Monthly revenue report',
    desc: 'Revenue and order count per month for delivered orders (date extraction + SUM).',
    sql: `SELECT EXTRACT(YEAR FROM o.orderdate) AS year,
                 EXTRACT(MONTH FROM o.orderdate) AS month,
                 COUNT(DISTINCT o.orderid) AS orders,
                 SUM(oi.quantity * oi.unitprice) AS revenue
          FROM orders o JOIN order_items oi ON o.orderid = oi.orderid
          WHERE o.status = 'Delivered'
          GROUP BY 1,2 ORDER BY year DESC, month DESC`,
  },
  {
    key: 'q3_hr_directory', tag: 'Stage 2',
    title: 'HR employee directory',
    desc: 'Employees with assigned warehouse location and hire year.',
    sql: `SELECT e.firstname, e.lastname, e.role, w.location AS warehouse,
                 EXTRACT(YEAR FROM e.hiredate) AS hire_year
          FROM employees e JOIN warehouses w ON e.warehouseid = w.warehouseid
          ORDER BY e.hiredate ASC`,
  },
  {
    key: 'q4_checkout_history', tag: 'Stage 2',
    title: 'Customer checkout history',
    desc: 'Active orders with customer, shipper and coupon discount (4-table JOIN + optional FK).',
    sql: `SELECT c.firstname || ' ' || c.lastname AS customer, o.orderdate,
                 sh.companyname AS shipping_method, cp.discountpercent AS coupon_discount
          FROM orders o
          JOIN customers c ON o.customerid = c.customerid
          JOIN shippers sh ON o.shipperid = sh.shipperid
          LEFT JOIN coupons cp ON o.couponid = cp.couponid
          WHERE o.status IN ('Processing','Shipped')
          ORDER BY o.orderdate DESC`,
  },
  {
    key: 'q8_top_spender', tag: 'Stage 2',
    title: 'Top spending customer',
    desc: 'The single highest lifetime-spend customer (GROUP BY + ORDER BY + LIMIT).',
    sql: `SELECT c.firstname, c.lastname, SUM(oi.quantity * oi.unitprice) AS total_spent
          FROM customers c
          JOIN orders o ON c.customerid = o.customerid
          JOIN order_items oi ON o.orderid = oi.orderid
          GROUP BY c.customerid, c.firstname, c.lastname
          ORDER BY total_spent DESC LIMIT 1`,
  },
  {
    key: 'v_customer_order_summary', tag: 'Stage 3 View',
    title: 'View: customer order summary (local)',
    desc: 'Stage-3 view v_customer_order_summary - total orders per customer.',
    sql: `SELECT * FROM v_customer_order_summary ORDER BY totalorders DESC`,
  },
  {
    key: 'v_delivery_incidents', tag: 'Stage 3 View',
    title: 'View: delivery incidents (remote)',
    desc: 'Stage-3 view v_delivery_incidents - incidents from the integrated logistics DB.',
    sql: `SELECT * FROM v_delivery_incidents ORDER BY incidentdate DESC`,
  },
  {
    key: 'v_order_tracking', tag: 'Stage 3 View',
    title: 'View: order tracking (INTEGRATED)',
    desc: 'Stage-3 integrated view v_order_tracking - local orders joined with remote deliveries.',
    sql: `SELECT * FROM v_order_tracking ORDER BY orderdate DESC`,
  },
];

const router = Router();

router.get('/queries', (_req, res) => {
  res.json({ queries: QUERIES.map(({ key, title, desc, tag }) => ({ key, title, desc, tag })) });
});

router.post('/queries/run', async (req, res) => {
  try {
    const q = QUERIES.find((x) => x.key === req.body?.key);
    if (!q) throw new Error('Unknown query');
    const { columns, rows } = await query(q.sql);
    res.json({ columns, rows });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
