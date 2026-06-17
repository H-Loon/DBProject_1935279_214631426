import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Database, FlaskConical, LogOut, RefreshCw, Circle, ChevronRight,
} from 'lucide-react';
import { api, type TableMeta } from './api.ts';
import { Logo } from './components/ui.tsx';
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';
import CrudView from './components/CrudView.tsx';
import ToolsView from './components/ToolsView.tsx';

const GROUP_ORDER = [
  'Catalog & Inventory', 'Sales & Customers', 'Operations', 'Integrated Logistics', 'Other',
];

type View = { type: 'dashboard' } | { type: 'table'; key: string } | { type: 'tools' };

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tables, setTables] = useState<TableMeta[] | null>(null);
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [dbStatus, setDbStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [loadError, setLoadError] = useState('');

  async function loadMeta() {
    try {
      const { tables } = await api.meta();
      setTables(tables);
      setLoadError('');
    } catch (e: any) {
      setLoadError(e.message);
      setTables([]);
    }
  }
  async function checkHealth() {
    try { await api.health(); setDbStatus('up'); } catch { setDbStatus('down'); }
  }

  useEffect(() => {
    if (!authed) return;
    checkHealth();
    loadMeta();
  }, [authed]);

  const grouped = useMemo(() => {
    const g: Record<string, TableMeta[]> = {};
    for (const t of tables || []) (g[t.group] ||= []).push(t);
    const order = [...GROUP_ORDER, ...Object.keys(g).filter((k) => !GROUP_ORDER.includes(k))];
    return order.filter((k) => g[k]).map((k) => ({ group: k, items: g[k] }));
  }, [tables]);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const activeKey = view.type === 'table' ? view.key : null;
  const currentTable = tables?.find((t) => t.key === activeKey) || null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-slate-100">
          <Logo size={32} />
          <span className="font-extrabold tracking-tight text-slate-900">NexusCommerce</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard"
                   active={view.type === 'dashboard'} onClick={() => setView({ type: 'dashboard' })} />

          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
              <div className="space-y-0.5">
                {items.map((t) => (
                  <NavItem key={t.key} icon={<Database className="w-4 h-4" />} label={t.title}
                           active={activeKey === t.key} onClick={() => setView({ type: 'table', key: t.key })} />
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tools</p>
            <NavItem icon={<FlaskConical className="w-4 h-4" />} label="Queries & Procedures"
                     active={view.type === 'tools'} onClick={() => setView({ type: 'tools' })} />
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-slate-100">
          <button onClick={() => { setAuthed(false); setView({ type: 'dashboard' }); }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-medium">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-bold text-slate-900">
              {view.type === 'dashboard' ? 'Dashboard'
                : view.type === 'tools' ? 'Queries & Procedures'
                : currentTable?.title}
            </span>
            {view.type === 'table' && <ChevronRight className="w-4 h-4 text-slate-300" />}
            {view.type === 'table' && <span>Manage records</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Circle className={`w-2.5 h-2.5 fill-current ${
                dbStatus === 'up' ? 'text-emerald-500' : dbStatus === 'down' ? 'text-rose-500' : 'text-amber-400'
              }`} />
              <span className="text-slate-500">
                {dbStatus === 'up' ? 'Database connected' : dbStatus === 'down' ? 'Database offline' : 'Checking…'}
              </span>
            </span>
            <button onClick={() => { checkHealth(); loadMeta(); }}
                    className="text-slate-400 hover:text-indigo-600" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {dbStatus === 'down' && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
              Can't reach the database. Check the backend <span className="font-mono">.env</span> connection settings,
              then click refresh. {loadError && <><br />Details: {loadError}</>}
            </div>
          )}
          {view.type === 'dashboard' && (
            <Dashboard groups={grouped} onOpen={(key) => setView({ type: 'table', key })}
                       onTools={() => setView({ type: 'tools' })} />
          )}
          {view.type === 'table' && currentTable && (
            <CrudView key={currentTable.key} table={currentTable} />
          )}
          {view.type === 'tools' && <ToolsView />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}>
      {icon}<span className="truncate">{label}</span>
    </button>
  );
}
