'use client';

import { useState } from 'react';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
  triggerMessage: string;
}

export function LeadCaptureModal({ open, onClose, triggerMessage }: LeadCaptureModalProps) {
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          company: form.company || undefined,
          triggerMessage,
          conversation: [],
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSent(true);
    } catch {
      setError('No pudimos guardar tu información. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">🎉</div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">¡Gracias!</h2>
            <p className="text-sm text-zinc-400">Un asesor de Camaral te contactará pronto.</p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Continuar chateando
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">Habla con nuestro equipo</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Déjanos tus datos y un asesor te contactará para darte una demo personalizada.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre (opcional)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Empresa (opcional)"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={sending || !form.email}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {sending ? 'Enviando…' : 'Quiero una demo'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
