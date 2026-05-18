'use client';

interface Lead {
  id: number;
  name: string | null;
  email: string;
  company: string | null;
  trigger_message: string;
  created_at: string;
}

interface LeadListProps {
  leads: Lead[];
  total: number;
}

export function LeadList({ leads, total }: LeadListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Leads Capturados</h2>
        <span className="text-sm text-zinc-500">{total} total</span>
      </div>
      <div className="rounded-xl border border-zinc-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/60">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Empresa</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Mensaje detonador</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={lead.id} className={i % 2 === 0 ? 'bg-zinc-900/40' : ''}>
                <td className="px-4 py-3 text-zinc-300">{lead.email}</td>
                <td className="px-4 py-3 text-zinc-400">{lead.company ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">{lead.trigger_message}</td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">
                  {new Date(lead.created_at).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Aún no hay leads capturados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
