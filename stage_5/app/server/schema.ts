/**
 * schema.ts - Live database introspection.
 *
 * Reads the catalog (information_schema) once and builds a rich description of
 * every table: columns, types, primary keys, foreign keys, a human label
 * expression, and which columns to show/hide. The CRUD layer is built entirely
 * from this metadata, so the UI adapts to whatever the integrated DB contains.
 */
import { CONFIG, queryObjects } from './db.ts';
import { OVERRIDES, type TableOverride } from './overrides.ts';

export type FieldType = 'text' | 'int' | 'numeric' | 'date' | 'timestamp' | 'bool';

export interface Fk {
  schema: string;
  table: string;
  refPk: string;
  /** SQL expression returning the referenced row's label; uses alias "t". */
  refLabelExpr: string;
}

export interface Column {
  name: string;
  label: string;       // friendly header (Title Case)
  type: FieldType;
  required: boolean;
  isPk: boolean;
  fk?: Fk;
  options?: string[];  // enum / choice values, if any
}

export interface TableMeta {
  key: string;         // "schema.table"
  schema: string;
  name: string;
  title: string;
  group: string;
  readOnly: boolean;
  isForeign: boolean;
  pk: string[];
  autoPk: boolean;     // single surrogate int pk -> generated on insert
  label: string;       // SQL expr (alias "t") for the row's display name
  columns: Column[];
}

let cache: Record<string, TableMeta> | null = null;

const mapType = (dataType: string): FieldType => {
  const d = dataType.toLowerCase();
  if (/(^|\s)(integer|bigint|smallint|serial)/.test(d)) return 'int';
  if (/(numeric|decimal|real|double|money)/.test(d)) return 'numeric';
  if (d === 'date') return 'date';
  if (d.startsWith('timestamp') || d.startsWith('time')) return 'timestamp';
  if (d === 'boolean') return 'bool';
  return 'text';
};

const titleCase = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Heuristic label expression (alias "t") when no override is given. */
function deriveLabel(colNames: string[], pk: string[]): string {
  const has = (n: string) => colNames.includes(n);
  if (has('firstname') && has('lastname')) return "t.firstname || ' ' || t.lastname";
  const byName = colNames.find((c) => c.endsWith('name'));
  if (byName) return `t.${byName}`;
  const byCode = colNames.find((c) => c.endsWith('code'));
  if (byCode) return `t.${byCode}`;
  const firstText = colNames.find((c) => !pk.includes(c));
  if (firstText) return `t.${firstText}`;
  return pk.length ? `t.${pk[0]}::text` : "''";
}

export async function buildSchema(): Promise<Record<string, TableMeta>> {
  const schemas = [CONFIG.localSchema, CONFIG.remoteSchema];

  const tablesRaw = await queryObjects(
    `SELECT table_schema, table_name, table_type
     FROM information_schema.tables
     WHERE table_schema = ANY($1) AND table_type IN ('BASE TABLE','FOREIGN')
     ORDER BY table_schema, table_name`,
    [schemas],
  );

  const colsRaw = await queryObjects(
    `SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position
     FROM information_schema.columns
     WHERE table_schema = ANY($1)
     ORDER BY table_schema, table_name, ordinal_position`,
    [schemas],
  );

  const pkRaw = await queryObjects(
    `SELECT tc.table_schema, tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = ANY($1)
     ORDER BY kcu.ordinal_position`,
    [schemas],
  );

  const fkRaw = await queryObjects(
    `SELECT tc.table_schema, tc.table_name, kcu.column_name,
            ccu.table_schema AS ref_schema, ccu.table_name AS ref_table, ccu.column_name AS ref_col
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = ANY($1)`,
    [schemas],
  );

  // index catalog rows by table key
  const colsByTable: Record<string, any[]> = {};
  for (const c of colsRaw) {
    const k = `${c.table_schema}.${c.table_name}`;
    (colsByTable[k] ||= []).push(c);
  }
  const pkByTable: Record<string, string[]> = {};
  for (const p of pkRaw) {
    const k = `${p.table_schema}.${p.table_name}`;
    (pkByTable[k] ||= []).push(p.column_name);
  }
  const fkByTable: Record<string, Record<string, any>> = {};
  for (const f of fkRaw) {
    const k = `${f.table_schema}.${f.table_name}`;
    (fkByTable[k] ||= {})[f.column_name] = f;
  }

  // first pass: collect column names + resolved pk + label per table (needed
  // so FK columns can borrow their referenced table's label expression)
  const colNames: Record<string, string[]> = {};
  const pkOf: Record<string, string[]> = {};
  const labelOf: Record<string, string> = {};
  for (const t of tablesRaw) {
    const k = `${t.table_schema}.${t.table_name}`;
    const ov: TableOverride = OVERRIDES[k] || {};
    const names = (colsByTable[k] || []).map((c) => c.column_name);
    colNames[k] = names;
    pkOf[k] = ov.pk || pkByTable[k] || [];
    labelOf[k] = ov.label || deriveLabel(names, pkOf[k]);
  }

  const result: Record<string, TableMeta> = {};
  for (const t of tablesRaw) {
    const k = `${t.table_schema}.${t.table_name}`;
    const ov: TableOverride = OVERRIDES[k] || {};
    const isForeign = t.table_type === 'FOREIGN';
    const pk = pkOf[k];
    const fks = fkByTable[k] || {};
    const enums: Record<string, string[]> = ov.enums || {};

    const columns: Column[] = (colsByTable[k] || []).map((c) => {
      const fkRow = fks[c.column_name];
      const fk: Fk | undefined = fkRow
        ? {
            schema: fkRow.ref_schema,
            table: fkRow.ref_table,
            refPk: fkRow.ref_col,
            refLabelExpr: labelOf[`${fkRow.ref_schema}.${fkRow.ref_table}`] || `t.${fkRow.ref_col}`,
          }
        : undefined;
      const isPk = pk.includes(c.column_name);
      // For a foreign key, drop the trailing "id" so the header reads as the
      // related entity (categoryid -> "Category"), since the cell shows a name.
      const label = fk
        ? titleCase(c.column_name.replace(/_?id$/i, '') || c.column_name)
        : titleCase(c.column_name);
      return {
        name: c.column_name,
        label,
        type: mapType(c.data_type),
        required: c.is_nullable === 'NO',
        isPk,
        fk,
        options: enums[c.column_name],
      };
    });

    const autoPk =
      pk.length === 1 &&
      !fks[pk[0]] &&
      (columns.find((c) => c.name === pk[0])?.type === 'int');

    // remote/foreign tables are read-only unless an override says otherwise,
    // and any table without a usable pk can't support update/delete
    const readOnly =
      ov.readOnly !== undefined ? ov.readOnly : (isForeign || pk.length === 0);

    result[k] = {
      key: k,
      schema: t.table_schema,
      name: t.table_name,
      title: ov.title || titleCase(t.table_name),
      group: ov.group || 'Other',
      readOnly,
      isForeign,
      pk,
      autoPk,
      label: labelOf[k],
      columns,
    };
  }

  cache = result;
  return result;
}

export async function getSchema(force = false): Promise<Record<string, TableMeta>> {
  if (!cache || force) await buildSchema();
  return cache!;
}

export async function getTable(key: string): Promise<TableMeta> {
  const s = await getSchema();
  const t = s[key];
  if (!t) throw new Error(`Unknown table: ${key}`);
  return t;
}
