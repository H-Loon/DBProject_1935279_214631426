import React, { useState } from 'react';
import { api } from '../api.ts';
import { Logo, Button, ErrorBox } from './ui.tsx';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-1 justify-center">
          <Logo size={40} />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">NexusCommerce</span>
        </div>
        <p className="text-center text-sm text-slate-500 mb-8">
          E-Commerce Database Management · Stage 5
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <ErrorBox message={error} />}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Log in'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Default login: <span className="font-mono">admin / admin</span><br />
          DB credentials live in the backend <span className="font-mono">.env</span>
        </p>
      </div>
    </div>
  );
}
