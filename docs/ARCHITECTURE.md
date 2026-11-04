# NEXUS MVP — Architecture

## 1. Analyse de l'existant (HUB_RESA → NEXUS)
| Mesure | Valeur |
|---|---|
| Fichiers TS/TSX | 277 (≈19 400 lignes serveur, ≈51 000 client) |
| Tables Drizzle déclarées | 83 · routeurs tRPC : 24 · pages : 52 |
| `any` | 327 · fichiers liés à Manus/forge : 18 · tests : 15 |
| Fichiers géants | HubVoyage.tsx 2 367 l., TransportDashboard.tsx 2 110 l., transport-db.ts 2 019 l. |

**Diagnostic** : trop de surface pour la valeur démontrée (9 verticales, 83 tables) ; dépendance Manus ; migration MySQL→PG avec `@ts-nocheck` ; API Vercel contournée par un bundle committé (`api/server.mjs`) ; 404 sur les routes SPA jamais élucidé.
**Décision** : repartir de zéro sur le cœur métier unique — *une entreprise publie des offres, un client réserve, 1 réservation = 1 crédit (125 FCFA)* — et ajouter les verticales en données, pas en tables.

## 2. Architecture système
```
Navigateur (React SPA, Vite)
   │  fetch same-origin, cookie HttpOnly
   ▼
Vercel CDN ── fichiers statiques (dist/) + fallback SPA
   │  /api/*
   ▼
Fonction serverless unique  api/[...slug].ts  ── Hono (validation zod, auth JWT)
   │  pg Pool (max 1) via URL « pooled »
   ▼
Neon PostgreSQL
```
- **Un seul déploiement, une seule origine** : pas de CORS, cookies `SameSite=Lax` + contrôle d'`Origin` sur les écritures.
- **Types de bout en bout** : le client `hc<AppType>` infère routes, entrées et sorties depuis le serveur (pas de codegen).
- **Intégrité dans la base** : contraintes CHECK/FK ; réservation = transaction avec gardes dans les `UPDATE ... WHERE` (pas de survente, pas de crédit négatif, rollback complet).
- **Journal de crédits** (`credit_ledger`) : toute variation de solde y est tracée.

## 3. Structure
```
api/[...slug].ts      point d'entrée Vercel (adapte Hono → Node)
server/app.ts         composition, erreurs, headers de sécurité, type AppType
server/routes/        auth · catalog · bookings · company · admin
server/lib/           auth (jose+bcrypt) · errors · validate
server/middleware/    session · requireRole · sameOrigin
server/db/            schema.ts (Drizzle) · client.ts (pool)
db/schema.sql         schéma de référence (idempotent), exécuté tel quel par les tests
shared/constants.ts   activités, prix du crédit
src/                  React : lib/(api,auth) · components/ · pages/
tests/                vitest + PGlite (Postgres réel en mémoire)
scripts/              migrate.mjs · seed-admin.mjs
```

## 4. Schéma
`users` 1—0..1 `companies` 1—N `offers` 1—N `bookings` N—1 `users` ; `credit_ledger` (N—1 companies, 0..1 booking).
Rôles : `admin | owner | customer`. Statut entreprise : `pending → active ⇄ suspended`. Voir `db/schema.sql`.

## 5. API (`/api`, JSON, erreurs `{error:{code,message}}`)
| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | /health | public | santé |
| POST | /auth/register | public | inscription (customer/owner) |
| POST | /auth/login · /auth/logout | public | session |
| GET | /auth/me | connecté | utilisateur courant |
| GET | /offers?activity&q&limit | public | catalogue (offres actives, entreprises validées, à venir) |
| GET | /offers/:id | public | détail |
| POST | /bookings | connecté | réserver (atomique, −1 crédit) |
| GET | /bookings/mine | connecté | mes réservations |
| POST | /bookings/:id/cancel | propriétaire de la résa | annule, rembourse 1 crédit |
| GET/POST | /company | owner | ma fiche / création (statut pending) |
| GET/POST | /company/offers · PATCH /company/offers/:id | owner | gérer mes offres |
| GET | /company/bookings · /company/ledger | owner | réservations reçues · journal |
| GET | /admin/stats · /admin/companies | admin | supervision |
| POST | /admin/companies/:id/status | admin | valider / suspendre |
| POST | /admin/companies/:id/credits | admin | recharge (crédits → FCFA) |

## 6. Interface
Routes : `/` catalogue (filtres, réservation) · `/login` `/register` · `/account` (client) · `/company` (owner : création, offres, réservations, crédits) · `/admin` (validation, recharge). `Guard` protège par rôle. État serveur : TanStack Query ; session : contexte `useAuth`. Thème sombre, orange `#f97316`.

## 7. Évolutivité (volontairement hors MVP)
Paiement mobile money (webhook → `credit_ledger`) · notifications e-mail/SMS · BD & commissions (table `referrals`) · champs/verticales spécifiques via `offers.attributes jsonb` · migrations versionnées (drizzle-kit) · rate limiting (Upstash/Vercel Firewall) · observabilité (Sentry).

## 8. Limites connues
- Pas de limitation de débit sur `/auth/login` (à ajouter via Vercel Firewall avant ouverture publique).
- Pas de vérification d'e-mail ni de réinitialisation de mot de passe.
- Le paiement des crédits est manuel (admin).
