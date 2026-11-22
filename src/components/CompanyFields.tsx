import { useState } from 'react';
import { ChipInput, CitySelect, CountrySelect } from './ChipInput';
import { ACTIVITIES } from '../../shared/constants';
import { citiesOf } from '../../shared/geo';
import { ACTIVITY_LABEL } from '../pages/Home';
import { useCountryName, useT } from '../lib/i18n';

export type Activity = (typeof ACTIVITIES)[number];

/** Brouillon de formulaire : les coordonnées restent des textes saisissables, converties à l'envoi. */
export interface CompanyDraft {
  name: string; activity: Activity; country: string; city: string; address: string;
  latitude: string; longitude: string; phone: string; email: string; rccm: string; serviceCities: string[]; scopes: string[];
}

export const emptyDraft = (): CompanyDraft => ({
  name: '', activity: ACTIVITIES[0], country: 'CI', city: '', address: '', latitude: '', longitude: '', phone: '', email: '', rccm: '', serviceCities: [], scopes: ['national'],
});

export const draftFrom = (c: { name: string; activity: string; country: string; city: string; address: string; latitude: number | null; longitude: number | null; phone: string; email: string; rccm: string; serviceCities: string[]; scopes?: string[] }): CompanyDraft => ({
  ...c, scopes: c.scopes?.length ? c.scopes : ['national'], activity: c.activity as Activity, latitude: c.latitude?.toString() ?? '', longitude: c.longitude?.toString() ?? '',
});

export const toPayload = (d: CompanyDraft) => ({ ...d, scopes: d.scopes as ('national' | 'international')[], latitude: Number(d.latitude), longitude: Number(d.longitude) });

const validCoords = (lat: string, lng: string) =>
  lat.trim() !== '' && lng.trim() !== '' && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180 && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

function GeoField({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  const t = useT();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const locate = () => {
    if (!('geolocation' in navigator)) return setMsg(t("La géolocalisation n'est pas disponible sur cet appareil : saisissez les coordonnées."));
    setBusy(true); setMsg('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); onChange(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6)); setMsg(t('Position enregistrée (précision ≈ {m} m).', { m: Math.round(p.coords.accuracy) })); },
      (e) => { setBusy(false); setMsg(e.code === 1 ? t('Autorisation refusée : autorisez la localisation dans le navigateur ou saisissez les coordonnées.') : t('Position introuvable, réessayez ou saisissez les coordonnées.')); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  const ok = validCoords(lat, lng);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{t('Géolocalisation de l’entreprise')}</legend>
      <p className="text-xs text-zinc-500">{t('Placez-vous sur le lieu de votre établissement puis utilisez votre position, ou saisissez les coordonnées.')}</p>
      <button type="button" className="btn-ghost" onClick={locate} disabled={busy}>{busy ? t('Localisation…') : t('Utiliser ma position actuelle')}</button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label htmlFor="g-lat" className="text-xs text-zinc-400">{t('Latitude')}</label>
          <input id="g-lat" className="input" required inputMode="decimal" placeholder="5.359900" value={lat} onChange={(e) => onChange(e.target.value, lng)} /></div>
        <div className="space-y-1"><label htmlFor="g-lng" className="text-xs text-zinc-400">{t('Longitude')}</label>
          <input id="g-lng" className="input" required inputMode="decimal" placeholder="-3.989900" value={lng} onChange={(e) => onChange(lat, e.target.value)} /></div>
      </div>
      {msg && <p className="text-xs text-zinc-400" role="status">{msg}</p>}
      {ok && <a className="text-sm text-brand" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}>{t('Vérifier l’emplacement sur la carte')}</a>}
      {!ok && lat.trim() !== '' && lng.trim() !== '' && <p className="text-xs text-red-300">{t('Coordonnées invalides (latitude −90 à 90, longitude −180 à 180).')}</p>}
    </fieldset>
  );
}

export const coordsOk = (d: CompanyDraft) => validCoords(d.latitude, d.longitude);

/** Champs « entreprise » partagés entre la souscription et la correction d'une demande. */
export function CompanyFields({ value: f, onChange }: { value: CompanyDraft; onChange: (d: CompanyDraft) => void }) {
  const t = useT();
  const suggestions = citiesOf(f.country);
  const set = <K extends keyof CompanyDraft>(k: K, v: CompanyDraft[K]) => onChange({ ...f, [k]: v });
  return (
    <div className="space-y-4">
      <div className="space-y-1"><label htmlFor="c-name" className="text-sm font-medium">{t('Raison sociale / nom commercial')}</label>
        <input id="c-name" className="input" required minLength={2} value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
      <div className="space-y-1"><label htmlFor="c-act" className="text-sm font-medium">{t('Type de service')}</label>
        <select id="c-act" className="input" value={f.activity} onChange={(e) => set('activity', e.target.value as Activity)}>
          {ACTIVITIES.map((a) => <option key={a} value={a}>{t(ACTIVITY_LABEL[a])}</option>)}
        </select></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label htmlFor="c-country" className="text-sm font-medium">{t("Pays du marchand *")}</label>
          <CountrySelect id="c-country" value={f.country} onChange={(v) => onChange({ ...f, country: v, city: '' })} /></div>
        <div className="space-y-1"><label htmlFor="c-city" className="text-sm font-medium">{t('Ville')}</label>
          <CitySelect key={f.country} id="c-city" required country={f.country} value={f.city} onChange={(v) => set('city', v)} /></div>
      </div>
      <ScopeField value={f.scopes} onChange={(scopes) => set('scopes', scopes)} country={f.country} />
      <div className="space-y-1"><label htmlFor="c-addr" className="text-sm font-medium">{t('Adresse (quartier, rue, repère)')}</label>
        <input id="c-addr" className="input" required minLength={3} maxLength={200} value={f.address} onChange={(e) => set('address', e.target.value)} /></div>
      <GeoField lat={f.latitude} lng={f.longitude} onChange={(latitude, longitude) => onChange({ ...f, latitude, longitude })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label htmlFor="c-phone" className="text-sm font-medium">{t('Téléphone de l’entreprise')}</label>
          <input id="c-phone" className="input" type="tel" required placeholder="+225 07 00 00 00 00" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div className="space-y-1"><label htmlFor="c-email" className="text-sm font-medium">{t('E-mail de l’entreprise (facultatif)')}</label>
          <input id="c-email" className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
      </div>
      <div className="space-y-1"><label htmlFor="c-rccm" className="text-sm font-medium">{t('N° RCCM (facultatif)')}</label>
        <input id="c-rccm" className="input" maxLength={60} value={f.rccm} onChange={(e) => set('rccm', e.target.value)} /></div>
      <ChipInput label={t('Villes de service')} hint={f.activity === 'transport' ? t('Villes desservies par votre compagnie. Les arrêts se définissent pour chaque offre.') : t('Villes où vous proposez vos services.')}
        values={f.serviceCities} onChange={(v) => set('serviceCities', v)} suggestions={suggestions} max={30} placeholder={t('Ex. Bouaké')} />
    </div>
  );
}

/** Portée de l'activité : national, international, ou les deux (au moins un). */
export function ScopeField({ value, onChange, country }: { value: string[]; onChange: (v: string[]) => void; country: string }) {
  const t = useT();
  const cname = useCountryName();
  const toggle = (k: string) => {
    const next = value.includes(k) ? value.filter((x) => x !== k) : [...value, k];
    if (next.length) onChange(next);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{t('Portée de votre activité *')} <span className="text-xs font-normal text-zinc-400">{t('(plusieurs choix possibles)')}</span></legend>
      {[['national', 'National', t("Vos articles s'affichent aux clients connectés depuis {country}.", { country: cname(country) })], ['international', 'International', t('Vous pouvez publier des articles visibles dans tous les pays.')]].map(([k, label, hint]) => (
        <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 ${value.includes(k) ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}>
          <input type="checkbox" className="mt-1" checked={value.includes(k)} onChange={() => toggle(k)} />
          <span><span className="block text-sm font-semibold">{t(label)}</span><span className="block text-xs text-zinc-400">{hint}</span></span>
        </label>
      ))}
    </fieldset>
  );
}
