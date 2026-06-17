/**
 * subprograms.ts - Run the Stage-4 functions and procedures from the UI.
 *
 * Covers every calling style:
 *   - scalar function     : SELECT fn(...)           -> single value
 *   - REF CURSOR function : SELECT fn(...) in a txn, then FETCH ALL -> table
 *   - procedure           : CALL pr(...)             -> success + NOTICE log
 *
 * NOTICE messages raised by the PL/pgSQL code are captured and returned so the
 * user can see what happened (e.g. which products were updated).
 */
import { Router } from 'express';
import { pool } from './db.ts';

type Kind = 'scalar' | 'cursor' | 'procedure';
interface Param {
  name: string;
  label: string;
  type: 'int' | 'numeric' | 'text';
  default?: string;
  fk?: { schema: string; table: string; pk: string };
}
interface SubProgram {
  key: string;
  kind: Kind;
  category: 'function' | 'procedure';
  title: string;
  desc: string;
  fn: string;            // qualified name
  params: Param[];       // in call order
}

export const SUBPROGRAMS: SubProgram[] = [
  {
    key: 'fn_warehouse_value', kind: 'scalar', category: 'function',
    title: 'fn_calculate_warehouse_stock_value',
    desc: 'Function (scalar). Uses an explicit cursor over local products to total the ' +
          'stock value of a warehouse. Raises an exception if the warehouse does not exist.',
    fn: 'public.fn_calculate_warehouse_stock_value',
    params: [{
      name: 'p_warehouse_id', label: 'Warehouse', type: 'int', default: '1',
      fk: { schema: 'public', table: 'warehouses', pk: 'warehouseid' },
    }],
  },
  {
    key: 'fn_deliveries_cursor', kind: 'cursor', category: 'function',
    title: 'fn_get_deliveries_by_status_cursor',
    desc: 'Function returning a REF CURSOR of remote deliveries (joined with depots and ' +
          'rates) that have the chosen status. Fetched here inside a transaction.',
    fn: 'public.fn_get_deliveries_by_status_cursor',
    params: [{ name: 'p_status', label: 'Delivery status', type: 'text', default: 'Pending' }],
  },
  {
    key: 'pr_adjust_prices', kind: 'procedure', category: 'procedure',
    title: 'pr_adjust_category_prices_and_stock',
    desc: 'Procedure. Loops over the products of a category (implicit cursor) and updates ' +
          'price (and restocks low-stock items) with branching + multiple DML statements.',
    fn: 'public.pr_adjust_category_prices_and_stock',
    params: [
      { name: 'p_category_id', label: 'Category', type: 'int', default: '3',
        fk: { schema: 'public', table: 'categories', pk: 'categoryid' } },
      { name: 'p_price_factor', label: 'Price factor (e.g. 1.05)', type: 'numeric', default: '1.05' },
      { name: 'p_min_stock_add', label: 'Min stock to add', type: 'int', default: '20' },
    ],
  },
  {
    key: 'pr_incident', kind: 'procedure', category: 'procedure',
    title: 'pr_process_delivery_incident',
    desc: 'Procedure (cross-schema). Logs an incident on a remote delivery, flips its status ' +
          "(firing a trigger), and cancels the linked local order.",
    fn: 'public.pr_process_delivery_incident',
    params: [
      { name: 'p_delivery_id', label: 'Delivery', type: 'int', default: '101',
        fk: { schema: 'remote_logistics', table: 'deliveries', pk: 'deliveryid' } },
      { name: 'p_incident_type', label: 'Incident type', type: 'text', default: 'Breakdown' },
      { name: 'p_description', label: 'Description', type: 'text', default: 'Transport truck engine overheating.' },
    ],
  },
];

const router = Router();

router.get('/subprograms', (_req, res) => {
  res.json({
    subprograms: SUBPROGRAMS.map((s) => ({
      key: s.key, kind: s.kind, category: s.category,
      title: s.title, desc: s.desc, params: s.params,
    })),
  });
});

router.post('/subprograms/run', async (req, res) => {
  const sp = SUBPROGRAMS.find((x) => x.key === req.body?.key);
  if (!sp) return res.status(400).json({ error: 'Unknown sub-program' });

  const args = sp.params.map((p) => {
    const v = req.body?.params?.[p.name];
    if (v === undefined || v === null || v === '') return null;
    return p.type === 'text' ? v : Number(v);
  });
  const placeholders = sp.params.map((_, i) => `$${i + 1}`).join(', ');

  const client = await pool.connect();
  const notices: string[] = [];
  client.on('notice', (n: any) => notices.push(n.message));
  try {
    if (sp.kind === 'scalar') {
      const r = await client.query(`SELECT ${sp.fn}(${placeholders}) AS result`, args);
      res.json({ kind: 'scalar', value: r.rows[0]?.result, notices });
    } else if (sp.kind === 'cursor') {
      await client.query('BEGIN');
      const c = await client.query(`SELECT ${sp.fn}(${placeholders}) AS cur`, args);
      const cursorName = String(c.rows[0]?.cur || '');
      const fetched = await client.query({
        text: `FETCH ALL IN "${cursorName.replace(/"/g, '')}"`,
        rowMode: 'array',
      } as any);
      await client.query('COMMIT');
      res.json({
        kind: 'table',
        columns: fetched.fields.map((f: any) => f.name),
        rows: fetched.rows,
        notices,
      });
    } else {
      await client.query(`CALL ${sp.fn}(${placeholders})`, args);
      res.json({ kind: 'message', message: 'Procedure executed successfully.', notices });
    }
  } catch (e: any) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    let msg = e.message || String(e);
    if (e.detail) msg += ` (${e.detail})`;
    res.status(400).json({ error: msg, notices });
  } finally {
    client.release();
  }
});

export default router;
