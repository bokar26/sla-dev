// apps/web/src/components/auth/LoginDialog.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginDialog({ open, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await login(email.trim(), password, { admin: isAdmin });
      const role = data?.user?.role || (isAdmin ? 'admin' : 'user');

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard'); // or the main user landing
      }
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Log in to SLA</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring"
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring"
              placeholder="••••••••"
            />
          </label>

          <label className="flex items-center gap-2 pt-1">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            <span className="text-sm text-slate-600">Admin login</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <button
            className="underline underline-offset-2 hover:text-slate-800"
            onClick={() => {
              onClose?.();
              // send them to the demo form as "create an account" flow for now
              // adjust if you have a dedicated signup page
              navigate('/demo');
            }}
          >
            Create an account
          </button>

          <button
            className="underline underline-offset-2 hover:text-slate-800"
            onClick={() => setIsAdmin((v) => !v)}
            title="Toggle admin mode"
          >
            {isAdmin ? 'Use regular login' : 'Admin login'}
          </button>
        </div>

        <button
          className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
