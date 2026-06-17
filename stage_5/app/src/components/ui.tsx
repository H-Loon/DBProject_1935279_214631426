/** ui.tsx - small reusable presentational components (NexusCommerce look). */
import React from 'react';
import { ShoppingBag, X, Loader2 } from 'lucide-react';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200 shrink-0"
      style={{ width: size, height: size }}
    >
      <ShoppingBag className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'dark';
};
const VARIANTS: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
};
export function Button({ variant = 'primary', className = '', children, ...rest }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> {label || 'Loading...'}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center p-4 overflow-y-auto"
         onMouseDown={onClose}>
      <div
        className={`bg-white rounded-2xl border border-slate-200 shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} mt-12`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 whitespace-pre-wrap">
      {message}
    </div>
  );
}

/** Generic data grid: columns = header labels, rows = array of cell arrays or objects. */
export function DataTable({ columns, rows, renderActions }: {
  columns: string[];
  rows: any[][];
  renderActions?: (rowIndex: number) => React.ReactNode;
}) {
  if (!rows.length) {
    return <div className="text-center text-slate-400 text-sm py-10">No rows to display.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 whitespace-nowrap">{c}</th>
            ))}
            {renderActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((cells, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              {cells.map((v, j) => (
                <td key={j} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                  {v === null || v === undefined || v === '' ? <span className="text-slate-300">—</span> : String(v)}
                </td>
              ))}
              {renderActions && <td className="px-4 py-2.5 text-right">{renderActions(i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
