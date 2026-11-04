import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { CREDIT_PRICE_FCFA } from '../../shared/constants';

export function AdminDashboard() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'' | 'pending' | 'active' | 'suspended'>('pending');
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => unwrap(api.admin.stats.$get()) });
  const list = useQuery({ queryKey: ['admin-companies', status], queryFn: () => unwrap(api.admin.companies.$get({ query: status ? { status } : {} })) });
  const inv = () => { qc.invalidateQueries({ queryKey: ['admin-companies'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); };
  const setSt = useMutation({ mutationFn: (v: { id: string; status: 'active' | 'suspended' }) => unwrap(api.admin.companies[':id'].status.$post({ param: { id: v.id }, json: { status: v.status } })), onSuccess: inv });
  const topup = useMutation({ mutationFn: (v: { id: string; credits: number }) => unwrap(api.admin.companies[':id'].credits.$post({ param: { id: v.id }, json: { credits: v.credits } })), onSuccess: inv });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administration</h1>
      {stats.data && <p className="text-sm text-zinc-400">{stats.data.users} utilisateurs · {stats.data.companies} entreprises · {stats.data.bookings} réservations</p>}
      <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
        <option value="pending">En attente</option><option value="active">Actives</option><option value="suspended">Suspendues</option><option value="">Toutes</option>
      </select>
      <Err e={list.error ?? setSt.error ?? topup.error} />
      <ul className="space-y-3">
        {list.data?.companies.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{c.name} <span className="text-xs text-zinc-500">({c.status})</span></p><p className="text-sm text-zinc-400">{c.activity} · {c.city} · {c.ownerEmail} · {c.credits} crédits</p></div>
            <div className="flex gap-2">
              {c.status !== 'active' && <button className="btn" onClick={() => setSt.mutate({ id: c.id, status: 'active' })}>Valider</button>}
              {c.status === 'active' && <button className="btn-ghost" onClick={() => setSt.mutate({ id: c.id, status: 'suspended' })}>Suspendre</button>}
              <button className="btn-ghost" onClick={() => {
                const n = Number(prompt(`Crédits à ajouter (1 crédit = ${fcfa(CREDIT_PRICE_FCFA)}) :`));
                if (Number.isInteger(n) && n > 0) topup.mutate({ id: c.id, credits: n });
              }}>+ Crédits</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
