import React, { useEffect, useMemo, useState } from 'react';
import { Play, FileSearch, FunctionSquare, Cog, Terminal } from 'lucide-react';
import { api, type NamedQuery, type SubProgram, type SubParam } from '../api.ts';
import { Button, Badge, Spinner, ErrorBox, DataTable } from './ui.tsx';

type Selected =
  | { kind: 'query'; item: NamedQuery }
  | { kind: 'sub'; item: SubProgram };

type Result =
  | { kind: 'table'; columns: string[]; rows: any[][] }
  | { kind: 'scalar'; value: any }
  | { kind: 'message'; message: string }
  | null;

export default function ToolsView() {
  const [queries, setQueries] = useState<NamedQuery[]>([]);
  const [subs, setSubs] = useState<SubProgram[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [fkOpts, setFkOpts] = useState<Record<string, { id: any; label: string }[]>>({});
  const [result, setResult] = useState<Result>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.queries().then((r) => setQueries(r.queries)).catch(() => {});
    api.subprograms().then((r) => setSubs(r.subprograms)).catch(() => {});
  }, []);

  const queryGroups = useMemo(() => {
    const g: Record<string, NamedQuery[]> = {};
    for (const q of queries) (g[q.tag] ||= []).push(q);
    return g;
  }, [queries]);

  async function selectSub(item: SubProgram) {
    setSelected({ kind: 'sub', item });
    setResult(null); setNotices([]); setError('');
    const init: Record<string, string> = {};
    for (const p of item.params) init[p.name] = p.default ?? '';
    setParams(init);
    const opts: Record<string, { id: any; label: string }[]> = {};
    await Promise.all(item.params.filter((p) => p.fk).map(async (p) => {
      try {
        const { options } = await api.fkOptions(p.fk!.schema, p.fk!.table, p.fk!.pk);
        opts[p.name] = options;
      } catch { /* ignore */ }
    }));
    setFkOpts(opts);
  }

  function selectQuery(item: NamedQuery) {
    setSelected({ kind: 'query', item });
    setResult(null); setNotices([]); setError('');
  }

  async function run() {
    if (!selected) return;
    setBusy(true); setError(''); setResult(null); setNotices([]);
    try {
      if (selected.kind === 'query') {
        const { columns, rows } = await api.runQuery(selected.item.key);
        setResult({ kind: 'table', columns, rows });
      } else {
        const r = await api.runSub(selected.item.key, params);
        setNotices(r.notices || []);
        if (r.kind === 'table') setResult({ kind: 'table', columns: r.columns, rows: r.rows });
        else if (r.kind === 'scalar') setResult({ kind: 'scalar', value: r.value });
        else setResult({ kind: 'message', message: r.message });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Queries &amp; Procedures</h1>
      <p className="text-sm text-slate-500 mb-6">
        Run the Stage-2 queries, Stage-3 views, and the Stage-4 functions &amp; procedures.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* catalog */}
        <div className="w-full lg:w-72 shrink-0 space-y-5">
          {Object.entries(queryGroups).map(([tag, items]) => (
            <Section key={tag} title={tag} icon={<FileSearch className="w-4 h-4" />}>
              {items.map((q) => (
                <Item key={q.key} label={q.title}
                  active={selected?.kind === 'query' && selected.item.key === q.key}
                  onClick={() => selectQuery(q)} />
              ))}
            </Section>
          ))}
          <Section title="Functions (Stage 4)" icon={<FunctionSquare className="w-4 h-4" />}>
            {subs.filter((s) => s.category === 'function').map((s) => (
              <Item key={s.key} label={s.title}
                active={selected?.kind === 'sub' && selected.item.key === s.key}
                onClick={() => selectSub(s)} />
            ))}
          </Section>
          <Section title="Procedures (Stage 4)" icon={<Cog className="w-4 h-4" />}>
            {subs.filter((s) => s.category === 'procedure').map((s) => (
              <Item key={s.key} label={s.title}
                active={selected?.kind === 'sub' && selected.item.key === s.key}
                onClick={() => selectSub(s)} />
            ))}
          </Section>
        </div>

        {/* detail */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
              Select a query, function or procedure on the left.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-slate-900 font-mono text-sm">
                    {selected.kind === 'query' ? selected.item.title : selected.item.title}
                  </h2>
                  {selected.kind === 'sub' && (
                    <Badge color={selected.item.category === 'function' ? 'indigo' : 'amber'}>
                      {selected.item.kind === 'cursor' ? 'ref cursor' : selected.item.kind}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{selected.item.desc}</p>

                {selected.kind === 'sub' && selected.item.params.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {selected.item.params.map((p) => (
                      <ParamField key={p.name} param={p} value={params[p.name] ?? ''}
                        options={fkOpts[p.name]}
                        onChange={(v) => setParams((s) => ({ ...s, [p.name]: v }))} />
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <Button onClick={run} disabled={busy}>
                    <Play className="w-4 h-4" /> {busy ? 'Running…' : 'Run'}
                  </Button>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              {notices.length > 0 && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Terminal className="w-3.5 h-3.5" /> NOTICE output
                  </div>
                  {notices.map((n, i) => <div key={i}>· {n}</div>)}
                </div>
              )}

              {result?.kind === 'scalar' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Result</p>
                  <p className="text-3xl font-extrabold text-emerald-600">{String(result.value)}</p>
                </div>
              )}
              {result?.kind === 'message' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                  {result.message}
                </div>
              )}
              {result?.kind === 'table' && (
                <>
                  <DataTable columns={result.columns} rows={result.rows} />
                  <p className="text-xs text-slate-400">{result.rows.length} row(s).</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3">
      <p className="flex items-center gap-2 px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon}{title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Item({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors truncate ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
      }`}>
      {label}
    </button>
  );
}

function ParamField({ param, value, options, onChange }: {
  param: SubParam; value: string; options?: { id: any; label: string }[]; onChange: (v: string) => void;
}) {
  const cls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{param.label}</label>
      {param.fk ? (
        <select className={cls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— select —</option>
          {(options || []).map((o) => <option key={String(o.id)} value={o.id}>{o.label}</option>)}
        </select>
      ) : (
        <input type={param.type === 'text' ? 'text' : 'number'} step={param.type === 'numeric' ? 'any' : undefined}
          className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
