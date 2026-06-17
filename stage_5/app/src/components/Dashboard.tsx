import { Database, FlaskConical, Lock, ArrowRight } from 'lucide-react';
import type { TableMeta } from '../api.ts';

export default function Dashboard({ groups, onOpen, onTools }: {
  groups: { group: string; items: TableMeta[] }[];
  onOpen: (key: string) => void;
  onTools: () => void;
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage {total} tables across the e-commerce + integrated logistics database.
          </p>
        </div>
        <button onClick={onTools}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
          <FlaskConical className="w-4 h-4" /> Queries & Procedures
        </button>
      </div>

      {groups.map(({ group, items }) => (
        <section key={group}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t) => (
              <button key={t.key} onClick={() => onOpen(t.key)}
                className="group text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  {t.readOnly
                    ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400"><Lock className="w-3 h-3" /> Read-only</span>
                    : <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />}
                </div>
                <h3 className="font-bold text-slate-900">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.columns.filter((c) => c.displayed).length} fields
                  {t.isForeign && ' · remote'}
                </p>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section>
        <button onClick={onTools}
          className="w-full text-left bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between hover:bg-slate-800 transition-colors">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-400" /> Queries & Procedures
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Run the Stage-2 queries, Stage-3 views, and the Stage-4 functions & procedures.
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-indigo-400" />
        </button>
      </section>
    </div>
  );
}
