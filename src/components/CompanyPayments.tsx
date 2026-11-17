import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../lib/api';
import { Err } from './Layout';

/** Paiement direct : le marchand relie son compte ORZAYAH ; l'argent de ses clients arrive chez lui, sans passer par BackMarket. */
export function CompanyPayments() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['payments-setup'], queryFn: () => unwrap(api.company['payments-setup'].$get()) });
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['payments-setup'] });
  const save = useMutation({
    mutationFn: () => unwrap(api.company['payments-setup'].$put({ json: { apiKey, ...(secret ? { webhookSecret: secret } : {}) } })),
    onSuccess: () => { setApiKey(''); setSecret(''); refresh(); qc.invalidateQueries({ queryKey: ['company'] }); },
  });
  const off = useMutation({ mutationFn: () => unwrap(api.company['payments-setup'].$delete()), onSuccess: refresh });
  const d = q.data;
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };
  const copy = async () => { try { await navigator.clipboard.writeText(d!.webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copiez ce lien :', d!.webhookUrl); } };

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-lg font-bold">Recevoir mes paiements en ligne</h2>
        <p className="mt-1 text-sm text-zinc-400">Reliez votre compte ORZAYAH : quand un client paie en ligne, l'argent arrive directement sur votre compte, sans passer par BackMarket.</p>
      </div>
      <Err e={q.error ?? save.error ?? off.error} />
      {d && (d.connected ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-sm font-medium text-emerald-300">✓ Compte ORZAYAH relié{d.connectedAt ? ` le ${dateFr(d.connectedAt)}` : ''}. Vos clients peuvent payer en ligne.</p>
          {!d.webhookConfigured && <p className="text-sm text-amber-300">Notification automatique non configurée : un paiement est alors confirmé quand le client revient sur le site. Ajoutez le webhook ci-dessous pour une confirmation immédiate.</p>}
          <button type="button" className="btn-ghost" disabled={off.isPending} onClick={() => confirm('Déconnecter votre compte ORZAYAH ? Vos clients ne pourront plus payer en ligne.') && off.mutate()}>Déconnecter mon compte</button>
        </div>
      ) : (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">Compte non relié : vos clients ne peuvent payer qu'à la livraison.</p>
      ))}
      {d && (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-medium">{d.connected ? 'Remplacer la clé' : 'Relier mon compte ORZAYAH'}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-400">
            <li>Dans votre espace ORZAYAH, créez une clé API qui autorise les <b>liens de paiement</b>, puis collez-la ci-dessous.</li>
            <li>Dans les paramètres webhook d'ORZAYAH, ajoutez l'adresse ci-dessous (événement « payment.succeeded »), puis collez le secret <code>whsec_…</code> qu'ORZAYAH vous donne.</li>
          </ol>
          <div>
            <label htmlFor="orz-hook" className="text-xs text-zinc-400">Adresse du webhook à ajouter dans ORZAYAH</label>
            <div className="flex gap-2"><input id="orz-hook" className="input font-mono text-xs" readOnly value={d.webhookUrl} onFocus={(e) => e.currentTarget.select()} /><button type="button" className="btn-ghost" onClick={copy}>{copied ? 'Copié ✓' : 'Copier'}</button></div>
          </div>
          <div>
            <label htmlFor="orz-key" className="text-xs text-zinc-400">Clé API ORZAYAH</label>
            <input id="orz-key" className="input" type="password" autoComplete="off" required minLength={10} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Collez votre clé API" />
          </div>
          <div>
            <label htmlFor="orz-secret" className="text-xs text-zinc-400">Secret du webhook (recommandé)</label>
            <input id="orz-secret" className="input" type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="whsec_…" />
          </div>
          <button className="btn" disabled={save.isPending || apiKey.trim().length < 10}>{save.isPending ? 'Vérification…' : d.connected ? 'Remplacer et vérifier' : 'Relier et vérifier'}</button>
          <p className="text-xs text-zinc-500">Vos clés sont chiffrées et ne sont jamais réaffichées. Ne les partagez avec personne, pas même par message.</p>
        </form>
      )}
    </section>
  );
}
