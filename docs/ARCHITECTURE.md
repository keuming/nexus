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
Rôles : `admin | owner | customer`. Statut entreprise : `pending → active ⇄ suspended`, ou `pending → rejected → (correction) → pending`. Chaque décision enregistre `review_note`, `reviewed_at`, `reviewed_by`. Voir `db/schema.sql`.

## 5. API (`/api`, JSON, erreurs `{error:{code,message}}`)
| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | /health | public | santé |
| POST | /auth/register | public | inscription d'un client |
| POST | /auth/register-company | public | souscription entreprise : gérant + entreprise (adresse, géolocalisation, type de service), transaction unique, demande en attente |
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
| POST | /admin/companies/:id/review | admin | approuver / refuser une demande (motif obligatoire au refus, décision tracée) |
| POST | /admin/companies/:id/status | admin | suspendre / réactiver (entreprise déjà validée) |
| POST | /company/resubmit | owner | corriger et renvoyer une demande refusée |
| POST | /admin/companies/:id/credits | admin | recharge (crédits → FCFA) |

## 5 bis. Géographie, arrêts et PWA
- `shared/geo.ts` : référentiel de 18 pays et leurs villes principales (suggestions ; les villes et arrêts restent saisissables librement).
- Entreprise : `country`, `city` (siège), `service_cities[]`. Offre : `country` (destination/service), `city` (départ/service), `stops[]` (arrêts ou lieux indiqués par le fournisseur). Réservation : `stop` (arrêt choisi, obligatoire et validé côté serveur dès que l'offre en propose).
- Catalogue : filtres `country`, `city` (ville de l'offre **ou** arrêt, recherche partielle), `activity`, `q`.
- PWA : `manifest.webmanifest`, icônes, `sw.js` (coquille hors ligne ; jamais de cache sur `/api`), bouton « Installer l'app ».

## 6. Interface
Routes : `/` catalogue (filtres, réservation) · `/login` `/register` · `/account` (client) · `/company` (owner : création, offres, réservations, crédits) · `/admin` (validation, recharge). `Guard` protège par rôle. État serveur : TanStack Query ; session : contexte `useAuth`. Thème sombre, orange `#f97316`.

## 7. Évolutivité (volontairement hors MVP)
Paiement mobile money (webhook → `credit_ledger`) · notifications e-mail/SMS · BD & commissions (table `referrals`) · champs/verticales spécifiques via `offers.attributes jsonb` · migrations versionnées (drizzle-kit) · rate limiting (Upstash/Vercel Firewall) · observabilité (Sentry).

## 8. Limites connues
- Pas de limitation de débit sur `/auth/login` (à ajouter via Vercel Firewall avant ouverture publique).
- Pas de vérification d'e-mail ni de réinitialisation de mot de passe.
- Le paiement des crédits est manuel (admin).

## Paiement des réservations (API ORZAYAH)

**Principe** : NEXUS encaisse via un compte partenaire ORZAYAH unique (clé `ORZAYAH_API_KEY`, permission DEPOSIT, côté serveur uniquement). Le client paie en **Mobile Money** (Orange, MTN, Moov, Wave) : l'API publique ORZAYAH ne propose pas de paiement par carte/portefeuille. Les sommes encaissées sont suivies par fournisseur (`GET /admin/payouts`) et reversées manuellement (`POST /admin/companies/:id/payouts` pour tracer le reversement).

**Flux** `POST /bookings` avec `payment {operator, accountNumber}` :
1. Offre gratuite → confirmée immédiatement. Offre payante → transaction : places + 1 crédit bloqués, réservation `pending_payment`, ligne `payments` (clé d'idempotence `nx-<uuid>`, expire après `HOLD_MINUTES`, 15 par défaut).
2. `POST /deposits` (montant en centimes = FCFA × 100). Le client valide sur son téléphone.
3. Pas de webhook : le front interroge `GET /payments/:id` toutes les 4 s ; le serveur relit `GET /transactions/{clé}` (espacement ≥ 3 s, limite ORZAYAH 120 req/min/IP).
4. `SUCCESS` → réservation confirmée. `FAILED/CANCELLED/EXPIRED` ou délai dépassé → places et crédit rendus.
5. Paiement tardif après expiration : réservation rétablie si les places existent encore, sinon statut `needs_refund` (à rembourser, visible en admin).

**Robustesse** : toute erreur ORZAYAH incertaine (réseau, 429, 5xx) laisse le paiement `pending` et la même clé est rejouée → pas de double débit. Erreurs 400/401/403 = définitives → annulation. Nettoyage des paiements expirés « paresseux » (catalogue, réservation, suivi), sans cron. Max 3 paiements en attente par client.

**Limites connues** : Mobile Money uniquement ; les frais ORZAYAH (`fee_centimes`) sont enregistrés mais leur prise en charge reste à décider ; reversements et remboursements `needs_refund` sont manuels ; un paiement `paid` n'est plus relu (un remboursement fait côté ORZAYAH n'est pas répercuté automatiquement) ; non testé contre le vrai ORZAYAH (faux serveur conforme à la documentation).

## Photos des offres
4 photos max par offre. Avec `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET` (preset non signé) le navigateur envoie directement chaque photo à Cloudinary ; seule l'URL est enregistrée (`offer_photos.url`). Le serveur n'accepte que des URL `https://res.cloudinary.com/<notre compte>/image/upload/…`. `GET /api/offers/:id/photos/:n` redirige vers une version optimisée (`f_auto,q_auto,w_900`). Sans ces variables : repli JPEG en base64 dans Neon (`offer_photos.data`). Limite connue : pas de modification des photos après publication.

## Alertes
Table `notifications` (cloche dans l'en-tête pour fournisseurs et admins, relecture toutes les 20 s). Événements : réservation confirmée (gratuite : immédiate ; payante : à réception du paiement, une seule alerte grâce à l'index unique user+type+objet), annulation par le client, nouvelle demande partenaire (admins), paiement reçu après expiration à rembourser (admins). E-mail optionnel via Resend (`RESEND_API_KEY` + `MAIL_FROM`), texte brut, échec silencieux. Limite : pas de notification push hors application (à ajouter via Web Push si besoin).
