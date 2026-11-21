import type { ReactNode } from 'react';
import { COUNTRIES } from '../../../shared/geo';

export const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

export function Delta({ cur, prev }: { cur: number; prev: number }) {
  const d = pct(cur, prev);
  if (d === null) return <span className="text-xs text-zinc-500">{cur > 0 ? 'nouveau' : '—'}</span>;
  return <span className={`text-xs font-medium ${d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{d >= 0 ? '▲' : '▼'} {Math.abs(d)} % <span className="font-normal text-zinc-500">vs période préc.</span></span>;
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'warn' }) {
  return (
    <div className={`card !p-4 ${tone === 'warn' ? 'border-amber-500/50' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1">{sub}</p>}
    </div>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm text-zinc-400">{sub}</p>}</div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function CountryFilter({ value, onChange, label = 'Tous les pays' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <select aria-label="Pays" className="input !w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
    </select>
  );
}

/** Choix de pays multiples (vide = tous les pays). */
export function CountryChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((c) => (
          <button type="button" key={c} onClick={() => onChange(value.filter((x) => x !== c))} className="rounded-full bg-brand/20 px-2.5 py-0.5 text-xs text-brand" aria-label={`Retirer ${c}`}>{COUNTRIES.find((x) => x.code === c)?.name ?? c} ✕</button>
        ))}
        {!value.length && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-zinc-300">Tous les pays</span>}
      </div>
      <select aria-label="Ajouter un pays" className="input mt-2 !w-auto" value="" onChange={(e) => e.target.value && onChange([...new Set([...value, e.target.value])])}>
        <option value="">+ Ajouter un pays…</option>
        {COUNTRIES.filter((c) => !value.includes(c.code)).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
    </div>
  );
}

export const toLocal = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
export const toIso = (v: string) => (v ? new Date(v).toISOString() : null);
