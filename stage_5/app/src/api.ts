/** api.ts - typed fetch helpers for the Express backend (/api/*). */

export interface ColumnMeta {
  name: string;
  label: string;
  type: 'text' | 'int' | 'numeric' | 'date' | 'timestamp' | 'bool';
  required: boolean;
  isPk: boolean;
  isFk: boolean;
  fk: { schema: string; table: string; refPk: string } | null;
  options: string[] | null;
  displayed: boolean;
}
export interface TableMeta {
  key: string;
  title: string;
  group: string;
  readOnly: boolean;
  isForeign: boolean;
  pk: string[];
  columns: ColumnMeta[];
}
export interface GridResponse {
  columns: { key: string; label: string }[];
  rows: Record<string, any>[]; // each has __pk plus display values
}
export interface SubParam {
  name: string; label: string; type: 'int' | 'numeric' | 'text';
  default?: string; fk?: { schema: string; table: string; pk: string };
}
export interface SubProgram {
  key: string; kind: 'scalar' | 'cursor' | 'procedure';
  category: 'function' | 'procedure'; title: string; desc: string; params: SubParam[];
}
export interface NamedQuery { key: string; title: string; desc: string; tag: string; }

async function jfetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    jfetch<{ ok: boolean }>('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  health: () => jfetch<{ db: string }>('/api/health'),
  refreshSchema: () => jfetch<{ ok: boolean }>('/api/refresh-schema', { method: 'POST' }),

  meta: () => jfetch<{ tables: TableMeta[] }>('/api/meta'),
  rows: (key: string) => jfetch<GridResponse>(`/api/tables/${encodeURIComponent(key)}/rows`),
  records: (key: string) =>
    jfetch<{ records: { pk: Record<string, any>; label: string }[] }>(
      `/api/tables/${encodeURIComponent(key)}/records`),
  record: (key: string, pk: Record<string, any>) =>
    jfetch<{ values: Record<string, any> | null }>(
      `/api/tables/${encodeURIComponent(key)}/record?pk=${encodeURIComponent(JSON.stringify(pk))}`),
  fkOptions: (schema: string, table: string, pk?: string) =>
    jfetch<{ options: { id: any; label: string }[] }>(
      `/api/fk?schema=${schema}&table=${table}${pk ? `&pk=${pk}` : ''}`),

  insert: (key: string, values: Record<string, any>) =>
    jfetch<{ ok: boolean }>(`/api/tables/${encodeURIComponent(key)}`, {
      method: 'POST', body: JSON.stringify(values) }),
  update: (key: string, pk: Record<string, any>, values: Record<string, any>) =>
    jfetch<{ ok: boolean }>(`/api/tables/${encodeURIComponent(key)}`, {
      method: 'PUT', body: JSON.stringify({ pk, values }) }),
  remove: (key: string, pk: Record<string, any>) =>
    jfetch<{ ok: boolean }>(`/api/tables/${encodeURIComponent(key)}`, {
      method: 'DELETE', body: JSON.stringify({ pk }) }),

  queries: () => jfetch<{ queries: NamedQuery[] }>('/api/queries'),
  runQuery: (key: string) =>
    jfetch<{ columns: string[]; rows: any[][] }>('/api/queries/run', {
      method: 'POST', body: JSON.stringify({ key }) }),
  subprograms: () => jfetch<{ subprograms: SubProgram[] }>('/api/subprograms'),
  runSub: (key: string, params: Record<string, any>) =>
    jfetch<any>('/api/subprograms/run', { method: 'POST', body: JSON.stringify({ key, params }) }),
};
