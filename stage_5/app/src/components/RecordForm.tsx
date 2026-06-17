import React, { useEffect, useMemo, useState } from 'react';
import { api, type TableMeta, type ColumnMeta } from '../api.ts';
import { Modal, Button, ErrorBox, Spinner } from './ui.tsx';

type FkOpts = Record<string, { id: any; label: string }[]>;

export default function RecordForm({ table, mode, pk, onClose, onSaved }: {
  table: TableMeta;
  mode: 'add' | 'edit';
  pk?: Record<string, any>;
  onClose: () => void;
  onSaved: () => void;
}) {
  // mirror the backend's "editable columns" rule
  const autoPk = useMemo(() => {
    if (table.pk.length !== 1) return false;
    const col = table.columns.find((c) => c.name === table.pk[0]);
    return !!col && col.isPk && !col.isFk && col.type === 'int';
  }, [table]);

  const fields: ColumnMeta[] = useMemo(
    () => table.columns.filter((c) => (mode === 'edit' ? !c.isPk : !(autoPk && c.isPk))),
    [table, mode, autoPk],
  );

  const [values, setValues] = useState<Record<string, any>>({});
  const [fkOpts, setFkOpts] = useState<FkOpts>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // load FK dropdown options + (for edit) the current record values
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const opts: FkOpts = {};
        await Promise.all(
          fields.filter((f) => f.fk).map(async (f) => {
            const { options } = await api.fkOptions(f.fk!.schema, f.fk!.table, f.fk!.refPk);
            opts[f.name] = options;
          }),
        );
        if (!alive) return;
        setFkOpts(opts);

        if (mode === 'edit' && pk) {
          const { values: v } = await api.record(table.key, pk);
          if (!alive) return;
          const norm: Record<string, any> = {};
          for (const f of fields) {
            let val = v ? v[f.name] : '';
            if (val == null) val = '';
            if (f.type === 'date' && typeof val === 'string') val = val.slice(0, 10);
            norm[f.name] = val;
          }
          setValues(norm);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function set(name: string, v: any) {
    setValues((s) => ({ ...s, [name]: v }));
  }

  async function save() {
    setError('');
    // required-field check
    for (const f of fields) {
      if (f.required && (values[f.name] === '' || values[f.name] === undefined)) {
        setError(`"${f.label}" is required.`);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'add') await api.insert(table.key, values);
      else await api.update(table.key, pk!, values);
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${mode === 'add' ? 'Add' : 'Edit'} ${table.title.replace(/s$/, '')}`} onClose={onClose}>
      {loading ? (
        <Spinner label="Loading record…" />
      ) : (
        <div className="space-y-4">
          {mode === 'edit' && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              The record was loaded by name — edit any field and save.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <Field key={f.name} field={f} value={values[f.name] ?? ''}
                     options={fkOpts[f.name]} onChange={(v) => set(f.name, v)} />
            ))}
          </div>

          {error && <ErrorBox message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant={mode === 'add' ? 'success' : 'primary'} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : mode === 'add' ? 'Insert' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ field, value, options, onChange }: {
  field: ColumnMeta;
  value: any;
  options?: { id: any; label: string }[];
  onChange: (v: any) => void;
}) {
  const label = (
    <label className="block text-xs font-semibold text-slate-500 mb-1">
      {field.label}{field.required && <span className="text-rose-500"> *</span>}
    </label>
  );
  const cls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  // foreign key -> dropdown of NAMES
  if (field.isFk) {
    return (
      <div>
        {label}
        <select className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.required ? '— select —' : '— none —'}</option>
          {(options || []).map((o) => (
            <option key={String(o.id)} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  // enum / choice
  if (field.options) {
    return (
      <div>
        {label}
        <select className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">— select —</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  const inputType = field.type === 'date' ? 'date'
    : field.type === 'int' || field.type === 'numeric' ? 'number' : 'text';
  return (
    <div>
      {label}
      <input type={inputType} step={field.type === 'numeric' ? 'any' : undefined}
             className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
