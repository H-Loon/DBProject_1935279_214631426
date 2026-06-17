import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, Pencil, Trash2, Lock } from 'lucide-react';
import { api, type TableMeta, type GridResponse } from '../api.ts';
import { Button, Badge, Spinner, ErrorBox } from './ui.tsx';
import RecordForm from './RecordForm.tsx';

export default function CrudView({ table }: { table: TableMeta }) {
  const [grid, setGrid] = useState<GridResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ mode: 'add' | 'edit'; pk?: Record<string, any> } | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setGrid(await api.rows(table.key));
    } catch (e: any) {
      setError(e.message);
      setGrid(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [table.key]);

  const colKeys = grid?.columns.map((c) => c.key) || [];
  const filtered = useMemo(() => {
    if (!grid) return [];
    const q = search.toLowerCase().trim();
    if (!q) return grid.rows;
    return grid.rows.filter((r) =>
      colKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
  }, [grid, search]);

  async function del(pk: Record<string, any>) {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.remove(table.key, pk);
      load();
    } catch (e: any) {
      alert('Delete failed:\n\n' + e.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900">{table.title}</h1>
          {table.readOnly && <Badge color="slate"><Lock className="w-3 h-3 inline -mt-0.5 mr-1" />Read-only</Badge>}
          {table.isForeign && <Badge color="indigo">Remote</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Button variant="ghost" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          {!table.readOnly && (
            <Button variant="success" onClick={() => setForm({ mode: 'add' })}>
              <Plus className="w-4 h-4" /> Add New
            </Button>
          )}
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : grid && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <tr>
                  {grid.columns.map((c) => <th key={c.key} className="px-4 py-3 whitespace-nowrap">{c.label}</th>)}
                  {!table.readOnly && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={grid.columns.length + 1} className="px-4 py-10 text-center text-slate-400">
                    No rows to display.</td></tr>
                )}
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {grid.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                        {r[c.key] === null || r[c.key] === undefined || r[c.key] === ''
                          ? <span className="text-slate-300">—</span> : String(r[c.key])}
                      </td>
                    ))}
                    {!table.readOnly && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => setForm({ mode: 'edit', pk: r.__pk })}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs mr-3">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => del(r.__pk)}
                          className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-700 font-semibold text-xs">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">{filtered.length} row(s){search && ` (filtered from ${grid.rows.length})`}</p>
        </>
      )}

      {form && (
        <RecordForm table={table} mode={form.mode} pk={form.pk}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); load(); }} />
      )}
    </div>
  );
}
