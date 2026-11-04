import { z } from 'zod';
import { COUNTRY_CODES } from '../../shared/geo.js';

export const countryCode = z.enum(COUNTRY_CODES);
const place = (max = 100) => z.string().trim().min(2).max(max);
/** Liste de lieux : nettoyée, dédoublonnée (insensible à la casse) et bornée. */
export const placeList = (maxItems: number) =>
  z.array(place()).max(maxItems).default([]).transform((a) => {
    const seen = new Set<string>();
    return a.filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  });
export const cityName = place(80);

import { ACTIVITIES } from '../../shared/constants.js';

export const phoneField = z.string().trim().regex(/^\+?[0-9 ().-]{8,20}$/, 'Numéro de téléphone invalide');

/** Demande d'ouverture / de correction d'un compte fournisseur. */
export const companyInput = z.object({
  name: z.string().trim().min(2).max(120),
  activity: z.enum(ACTIVITIES),
  country: countryCode,
  city: cityName,
  serviceCities: placeList(30),
  address: z.string().trim().min(3, 'Adresse requise').max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: phoneField,
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(200)]).default(''),
  rccm: z.string().trim().max(60).default(''),
});
