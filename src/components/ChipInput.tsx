import { useId, useState } from 'react';
import { COUNTRIES as COUNTRIES_LIST, citiesOf } from '../../shared/geo';

const SORTED = [...COUNTRIES_LIST].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

/** Saisie d'une liste de lieux (villes de service, arrêts) : ajout par Entrée ou bouton, suggestions facultatives. */
export function ChipInput({ label, hint, values, onChange, suggestions = [], max = 20, placeholder }: {
  label: string; hint?: string; values: string[]; onChange: (v: string[]) => void; suggestions?: string[]; max?: number; placeholder?: string;
}) {
  const [text, setText] = useState('');
  const listId = useId();
  const add = () => {
    const t = text.trim();
    if (t.length < 2 || values.length >= max || values.some((x) => x.toLowerCase() === t.toLowerCase())) return setText('');
    onChange([...values, t]);
    setText('');
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-200">{label}</label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      <div className="flex gap-2">
        <input className="input" list={listId} value={text} placeholder={placeholder ?? 'Ajouter…'} maxLength={100}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn-ghost shrink-0" onClick={add}>Ajouter</button>
      </div>
      <datalist id={listId}>{suggestions.filter((s) => !values.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v} className="flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-1 text-sm">
              {v}
              <button type="button" aria-label={`Retirer ${v}`} className="rounded-full px-2 text-zinc-400 hover:text-white" onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Liste déroulante des villes d'un pays, avec « Autre ville… » pour saisir une ville absente de la liste. */
export function CitySelect({ id, country, value, onChange, extra = [], required }: { id?: string; country: string; value: string; onChange: (v: string) => void; extra?: string[]; required?: boolean }) {
  const options = [...new Set([...citiesOf(country), ...extra.filter(Boolean)])];
  const [other, setOther] = useState(false);
  const custom = other || (value !== '' && !options.includes(value));
  return (
    <div className="space-y-2">
      <select id={id} className="input" required={required} value={custom ? '__other' : value}
        onChange={(e) => { if (e.target.value === '__other') { setOther(true); onChange(''); } else { setOther(false); onChange(e.target.value); } }}>
        <option value="">Choisir une ville…</option>
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="__other">Autre ville…</option>
      </select>
      {custom && <input className="input" required={required} autoFocus={other && value === ''} maxLength={80} placeholder="Nom de la ville" aria-label="Autre ville" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

export function CountrySelect({ value, onChange, allowAll, id }: { value: string; onChange: (v: string) => void; allowAll?: boolean; id?: string }) {
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {allowAll && <option value="">Tous les pays</option>}
      {SORTED.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
    </select>
  );
}
