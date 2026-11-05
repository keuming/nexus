import { countryName } from '../../shared/geo';

interface Where { city?: string | null; country: string; destCity?: string | null; destCountry?: string | null }

/** Lieu d'une offre : « Abidjan → Bouaké (Côte d'Ivoire) » pour un trajet, sinon « Ville, Pays ». */
export function placeLabel(o: Where): string {
  if (o.destCity && o.destCountry) {
    return o.destCountry === o.country
      ? `${o.city} → ${o.destCity} (${countryName(o.country)})`
      : `${o.city}, ${countryName(o.country)} → ${o.destCity}, ${countryName(o.destCountry)}`;
  }
  return `${o.city ? `${o.city}, ` : ''}${countryName(o.country)}`;
}
