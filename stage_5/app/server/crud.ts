/**
 * crud.ts - Generic CRUD endpoints driven by the introspected schema.
 *
 * Requirement highlights this satisfies:
 *   - IDs are never shown: surrogate primary keys are selected as hidden
 *     "_pk_*" columns; foreign keys are displayed as the referenced row's
 *     NAME via a correlated sub-query (e.g. category name, not its id).
 *   - Insert auto-generates surrogate ids behind the scenes.
 *   - Update loads a record by name, returns its current values, then saves.
 */
import { Router } from 'express';
import { query, queryObjects } from './db.ts';
import { getSchema, getTable, type TableMeta, type Column } from './schema.ts';

const router = Router();

const qid = (s: string) => '"' + s.replace(/"/g, '""') + '"';

/** A column shown in the grid? (hide surrogate pk ids, show fk labels) */
function isDisplayed(c: Column): boolean {
  if (c.fk) return true;          // shown as a name
  if (c.isPk) return false;       // surrogate id -> hidden
  return true;
}

/** Columns editable in a form. */
function editableColumns(t: TableMeta, forUpdate: boolean): Column[] {
  return t.columns.filter((c) => {
    if (forUpdate && c.isPk) return false;        // can't change the key
    if (!forUpdate && t.autoPk && c.isPk) return false; // id auto-generated
    return true;
  });
}

/** GET /api/meta  -> the whole schema (tables grouped) for the UI. */
router.get('/meta', async (_req, res) => {
  try {
    const schema = await getSchema();
    const tables = Object.values(schema).map((t) => ({
      key: t.key,
      title: t.title,
      group: t.group,
      readOnly: t.readOnly,
      isForeign: t.isForeign,
      pk: t.pk,
      columns: t.columns.map((c) => ({
        name: c.name,
        label: c.label,
        type: c.type,
        required: c.required,
        isPk: c.isPk,
        isFk: !!c.fk,
        fk: c.fk ? { schema: c.fk.schema, table: c.fk.table, refPk: c.fk.refPk } : null,
        options: c.options || null,
        displayed: isDisplayed(c),
      })),
    }));
    res.json({ tables });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/tables/:key/rows  -> grid data with FK names resolved. */
router.get('/tables/:key/rows', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    const selects: string[] = [];
    const displayCols: { key: string; label: string }[] = [];

    for (const pk of t.pk) selects.push(`m.${qid(pk)} AS ${qid('_pk_' + pk)}`);

    for (const c of t.columns) {
      if (!isDisplayed(c)) continue;
      if (c.fk) {
        // correlated sub-query returns the referenced row's NAME
        selects.push(
          `(SELECT ${c.fk.refLabelExpr} FROM ${qid(c.fk.schema)}.${qid(c.fk.table)} t ` +
            `WHERE t.${qid(c.fk.refPk)} = m.${qid(c.name)}) AS ${qid(c.label)}`,
        );
      } else {
        selects.push(`m.${qid(c.name)} AS ${qid(c.label)}`);
      }
      displayCols.push({ key: c.label, label: c.label });
    }

    const orderBy = t.pk.length ? `ORDER BY ${t.pk.map((p) => `m.${qid(p)}`).join(', ')}` : '';
    const sql =
      `SELECT ${selects.join(', ')} FROM ${qid(t.schema)}.${qid(t.name)} m ${orderBy} LIMIT 1000`;
    const data = await queryObjects(sql);

    // split each row into { __pk, values }
    const rows = data.map((r) => {
      const pkObj: Record<string, any> = {};
      const values: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        if (k.startsWith('_pk_')) pkObj[k.slice(4)] = v;
        else values[k] = v;
      }
      return { __pk: pkObj, ...values };
    });

    res.json({ columns: displayCols, rows });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** GET /api/tables/:key/records  -> [{ pk, label }] for the Update picker. */
router.get('/tables/:key/records', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    if (!t.pk.length) return res.json({ records: [] });
    const pkSel = t.pk.map((p) => `t.${qid(p)} AS ${qid('_pk_' + p)}`).join(', ');
    const data = await queryObjects(
      `SELECT ${pkSel}, (${t.label}) AS __label FROM ${qid(t.schema)}.${qid(t.name)} t ` +
        `ORDER BY __label LIMIT 2000`,
    );
    const records = data.map((r) => {
      const pk: Record<string, any> = {};
      for (const p of t.pk) pk[p] = r['_pk_' + p];
      return { pk, label: r.__label == null ? '' : String(r.__label) };
    });
    res.json({ records });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** GET /api/tables/:key/record?pk=<json>  -> raw editable values for one row. */
router.get('/tables/:key/record', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    const pk = JSON.parse(String(req.query.pk || '{}'));
    const cols = editableColumns(t, true);
    const where = t.pk.map((p, i) => `${qid(p)} = $${i + 1}`).join(' AND ');
    const sql =
      `SELECT ${cols.map((c) => qid(c.name)).join(', ')} ` +
      `FROM ${qid(t.schema)}.${qid(t.name)} WHERE ${where}`;
    const data = await queryObjects(sql, t.pk.map((p) => pk[p]));
    res.json({ values: data[0] || null });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** GET /api/fk?schema=&table=&pk=&label?  -> dropdown options for a FK field. */
router.get('/fk', async (req, res) => {
  try {
    const schema = String(req.query.schema);
    const table = String(req.query.table);
    const all = await getSchema();
    const ref = all[`${schema}.${table}`];
    if (!ref) throw new Error(`Unknown referenced table ${schema}.${table}`);
    const refPk = String(req.query.pk || ref.pk[0]);
    const data = await queryObjects(
      `SELECT t.${qid(refPk)} AS id, (${ref.label}) AS label ` +
        `FROM ${qid(schema)}.${qid(table)} t ORDER BY label LIMIT 5000`,
    );
    res.json({ options: data.map((r) => ({ id: r.id, label: r.label == null ? '' : String(r.label) })) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** POST /api/tables/:key  -> insert (auto-generates surrogate id). */
router.post('/tables/:key', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    if (t.readOnly) throw new Error('This table is read-only.');
    const body = req.body || {};
    const cols = editableColumns(t, false);
    const names = cols.map((c) => c.name);
    const values = cols.map((c) => normalize(body[c.name], c));

    if (t.autoPk) {
      const pk = t.pk[0];
      const r = await queryObjects(
        `SELECT COALESCE(MAX(${qid(pk)}), 0) + 1 AS next FROM ${qid(t.schema)}.${qid(t.name)}`,
      );
      names.unshift(pk);
      values.unshift(r[0].next);
    }

    const placeholders = names.map((_, i) => `$${i + 1}`).join(', ');
    const sql =
      `INSERT INTO ${qid(t.schema)}.${qid(t.name)} ` +
      `(${names.map(qid).join(', ')}) VALUES (${placeholders})`;
    await query(sql, values);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** PUT /api/tables/:key  body { pk, values }  -> update non-key columns. */
router.put('/tables/:key', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    if (t.readOnly) throw new Error('This table is read-only.');
    const { pk, values } = req.body || {};
    const cols = editableColumns(t, true);
    const sets = cols.map((c, i) => `${qid(c.name)} = $${i + 1}`).join(', ');
    const params = cols.map((c) => normalize(values[c.name], c));
    const where = t.pk.map((p, i) => `${qid(p)} = $${cols.length + i + 1}`).join(' AND ');
    params.push(...t.pk.map((p) => pk[p]));
    const sql = `UPDATE ${qid(t.schema)}.${qid(t.name)} SET ${sets} WHERE ${where}`;
    const r = await query(sql, params);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** DELETE /api/tables/:key  body { pk } */
router.delete('/tables/:key', async (req, res) => {
  try {
    const t = await getTable(req.params.key);
    if (t.readOnly) throw new Error('This table is read-only.');
    const { pk } = req.body || {};
    const where = t.pk.map((p, i) => `${qid(p)} = $${i + 1}`).join(' AND ');
    await query(`DELETE FROM ${qid(t.schema)}.${qid(t.name)} WHERE ${where}`, t.pk.map((p) => pk[p]));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: cleanErr(e) });
  }
});

/** Coerce a form value to the right JS type for pg. */
function normalize(v: any, c: Column): any {
  if (v === undefined || v === null || v === '') return null;
  if (c.fk || c.type === 'int') return Number(v);
  if (c.type === 'numeric') return Number(v);
  if (c.type === 'bool') return v === true || v === 'true';
  return v;
}

/** Surface Postgres errors (incl. trigger RAISE EXCEPTION) cleanly. */
function cleanErr(e: any): string {
  let msg = e.message || String(e);
  if (e.detail) msg += ` (${e.detail})`;
  return msg;
}

export default router;
