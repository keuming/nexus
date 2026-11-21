import { fcfa } from '../lib/api';

/** Histogramme des ventes par jour (SVG, sans dépendance). */
export function SalesChart({ data }: { data: { day: string; gmv: number; bookings: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.gmv));
  const w = 720, h = 180, pad = 4;
  const bw = (w - pad * 2) / Math.max(1, data.length);
  const total = data.reduce((a, d) => a + d.gmv, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="w-full" role="img" aria-label={`Ventes par jour : ${fcfa(total)} sur ${data.length} jours`}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={w} y1={h - h * f} y2={h - h * f} stroke="currentColor" strokeOpacity="0.08" />)}
        {data.map((d, i) => {
          const bh = Math.max(d.gmv ? 2 : 0, (d.gmv / max) * (h - 6));
          return (
            <g key={d.day}>
              <title>{`${new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${fcfa(d.gmv)} · ${d.bookings} réservation(s)`}</title>
              <rect x={pad + i * bw + 1} y={h - bh} width={Math.max(1, bw - 2)} height={bh} rx={2} className="fill-brand" opacity={d.gmv ? 0.9 : 0.25} />
            </g>
          );
        })}
        <text x={pad} y={h + 16} fontSize="11" className="fill-zinc-500">{new Date(data[0]?.day ?? Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</text>
        <text x={w - pad} y={h + 16} fontSize="11" textAnchor="end" className="fill-zinc-500">{new Date(data.at(-1)?.day ?? Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</text>
        <text x={w - pad} y={12} fontSize="11" textAnchor="end" className="fill-zinc-500">max {fcfa(max)}</text>
      </svg>
    </figure>
  );
}
