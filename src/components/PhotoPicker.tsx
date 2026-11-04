import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';

const MAX_SIDE = 1280;
const MAX_CHARS = 500_000; // limite serveur ≈ 375 Ko par photo

/** Redimensionne et recompresse en JPEG jusqu'à passer sous la limite d'envoi. */
async function compress(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Fichier non pris en charge (image attendue)');
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("Impossible de lire cette image"); });
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close();
  for (let q = 0.82; q >= 0.4; q -= 0.1) {
    const url = cv.toDataURL('image/jpeg', q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('Photo trop lourde, choisissez-en une plus légère');
}

/** Envoi direct vers Cloudinary (preset non signé) ; renvoie l'URL sécurisée de l'image. */
async function upload(cfg: { cloudName: string; preset: string }, dataUrl: string): Promise<string> {
  const form = new FormData();
  form.append('file', await (await fetch(dataUrl)).blob());
  form.append('upload_preset', cfg.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: 'POST', body: form });
  const json: any = await res.json().catch(() => null);
  if (!res.ok || typeof json?.secure_url !== 'string') throw new Error(json?.error?.message ?? "Échec de l'envoi de la photo");
  return json.secure_url;
}

/** Jusqu'à 4 photos avec aperçu et suppression. Envoyées à Cloudinary si configuré, sinon gardées en JPEG (data URL). */
export function PhotoPicker({ value, onChange, max = 4 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = useQuery({ queryKey: ['upload-config'], queryFn: () => unwrap(api.company['upload-config'].$get()), staleTime: Infinity });
  const add = async (files: FileList | null) => {
    if (!files) return;
    setErr(''); setBusy(true);
    try {
      const out = [...value];
      for (const f of Array.from(files)) { if (out.length >= max) break; const d = await compress(f); out.push(cfg.data?.cloudinary ? await upload(cfg.data.cloudinary, d) : d); onChange([...out]); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false); if (ref.current) ref.current.value = '';
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Photos ({value.length}/{max})</p>
      <div className="grid grid-cols-4 gap-2">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/15">
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" aria-label={`Retirer la photo ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs leading-5">✕</button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" disabled={busy || cfg.isLoading} onClick={() => ref.current?.click()}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/25 text-2xl text-zinc-400 hover:bg-white/5">{busy ? '…' : '+'}</button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} aria-label="Ajouter des photos" />
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <p className="text-xs text-zinc-500">Les photos sont réduites automatiquement avant l'envoi.</p>
    </div>
  );
}
