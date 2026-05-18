'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentList } from '@/components/admin/DocumentList';
import { LeadList } from '@/components/admin/LeadList';

type Tab = 'documents' | 'leads';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>('documents');
  const [docs, setDocs] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const [docsRes, leadsRes] = await Promise.all([
        fetch('/api/admin/documents', { headers: { Authorization: `Bearer ${s}` } }),
        fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${s}` } }),
      ]);
      if (!docsRes.ok) { setError('Credenciales inválidas'); return; }
      const [docsData, leadsData] = await Promise.all([docsRes.json(), leadsRes.json()]);
      setDocs(docsData);
      setLeads(leadsData.leads ?? []);
      setLeadsTotal(leadsData.total ?? 0);
      setAuthenticated(true);
    } catch {
      setError('Error al conectar con la API');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(secret);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mb-5 text-lg font-bold">
            C
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 mb-1">Admin Panel</h1>
          <p className="text-sm text-zinc-500 mb-6">Ingresa el secreto de administrador</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Admin secret"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-sm font-bold">C</div>
        <h1 className="font-semibold">Camaral Admin</h1>
        <a href="/" className="ml-auto text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Ir al chat
        </a>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {(['documents', 'leads'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t === 'documents' ? '📄 Documentos' : '👥 Leads'}
            </button>
          ))}
        </div>

        {tab === 'documents' && (
          <DocumentList docs={docs} secret={secret} onRefresh={() => fetchData(secret)} />
        )}
        {tab === 'leads' && <LeadList leads={leads} total={leadsTotal} />}
      </main>
    </div>
  );
}
