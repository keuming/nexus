# BackMarket MVP — Architecture

## 1. Analyse de l'existant (HUB_RESA → BackMarket)
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

## Paiement des réservations (liens de paiement ORZAYAH, paiement direct au marchand)

**Principe** : chaque marchand relie **son propre compte ORZAYAH** (Paramètres > « Recevoir mes paiements en ligne » : clé API + secret de webhook). Le lien de paiement d'un client est créé avec la clé du marchand : l'argent arrive directement sur son compte, BackMarket ne touche rien (0 % de commission pour l'instant). Les clés sont chiffrées en AES-256-GCM (`SECRETS_KEY`, sinon dérivée de `JWT_SECRET`) et ne sont jamais renvoyées par l'API. Sans compte relié, une offre n'accepte que le paiement à la livraison (`canPayOnline` = false, erreur `online_not_available`).

**Flux** `POST /bookings` avec `payMode: 'digital' | 'cash'` : offre gratuite → confirmée. Paiement à la livraison → confirmée, encaissement suivi par le marchand. Paiement en ligne → places + 1 crédit bloqués, réservation `pending_payment`, `payments.orz_scope = 'merchant'`, lien créé chez ORZAYAH avec la clé du marchand (clé d'idempotence `bm-<paymentId>`), le client est redirigé vers `payUrl` puis revient sur `/reservation/:id`.

**Confirmation** : webhook `POST /api/orzayah/webhook/:companyId` signé avec le secret propre au marchand (`t=<unix>,v1=HMAC-SHA256`, ±300 s), toujours suivi d'une relecture `GET /payment-links/:slug` (source de vérité) ; en complément, relecture à chaque visite de la page de réservation et avant expiration. Un webhook ne peut confirmer que les paiements de son marchand. L'ancien webhook `/api/orzayah/webhook` (clé BackMarket, `orz_scope = 'platform'`) ne sert plus qu'aux paiements créés avant le paiement direct.

**Remboursement** : si un marchand annule une commande payée en ligne, le paiement passe en `needs_refund` et le marchand rembourse lui-même depuis ORZAYAH (aucune alerte back-office, l'argent est chez lui). Déconnexion du compte refusée tant que des paiements en ligne sont en attente.

**Limites connues** : la vérification de la clé suppose qu'ORZAYAH répond 404 pour un lien inconnu et 401/403 pour une clé refusée (à confirmer en conditions réelles) ; frais ORZAYAH à la charge du marchand ; pas de commission BackMarket automatique ; les remboursements ne sont pas automatisés.

## Photos des offres
4 photos max par offre. Avec `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET` (preset non signé) le navigateur envoie directement chaque photo à Cloudinary ; seule l'URL est enregistrée (`offer_photos.url`). Le serveur n'accepte que des URL `https://res.cloudinary.com/<notre compte>/image/upload/…`. `GET /api/offers/:id/photos/:n` redirige vers une version optimisée (`f_auto,q_auto,w_900`). Sans ces variables : repli JPEG en base64 dans Neon (`offer_photos.data`). Limite connue : pas de modification des photos après publication.

## Alertes
Table `notifications` (cloche dans l'en-tête pour fournisseurs et admins, relecture toutes les 20 s). Événements : réservation confirmée (gratuite : immédiate ; payante : à réception du paiement, une seule alerte grâce à l'index unique user+type+objet), annulation par le client, nouvelle demande partenaire (admins), paiement reçu après expiration à rembourser (admins). E-mail optionnel via Resend (`RESEND_API_KEY` + `MAIL_FROM`), texte brut, échec silencieux. Limite : pas de notification push hors application (à ajouter via Web Push si besoin).

## Gestion des offres (tous types d'activité)
Chaque ligne de « Mes offres » : Modifier (formulaire prérempli, photos conservées/remplacées via `keep:N`), Dupliquer (nouvelle offre préremplie, date à choisir), Désactiver/Activer (disparaît du catalogue, réservations existantes conservées), Supprimer (refusé dès qu'une réservation existe, même annulée : on désactive pour garder l'historique). Capacité jamais inférieure aux places déjà réservées ; la date doit rester future si elle change. Libellés adaptés au type d'activité (plat, trajet, chambre…).

## Tableau de bord partenaire
Indicateurs (crédits, réservations confirmées, en attente de paiement, offres en ligne) puis 3 onglets : « Réservations clients » (par défaut, tableau filtrable par statut), « Mes offres » (liste à la demande ; « + Ajouter » ouvre le formulaire dans une fenêtre, « Publier l'offre » valide), « Paramètres » (villes de service).

## Pays et villes
`shared/geo.ts` : 18 pays, villes principales classées par population (recensements/estimations nationales et ONU via Worldometers, nov. 2026). Choix du pays → liste déroulante de ses villes (souscription entreprise, formulaire d'offre) avec « Autre ville… » pour une saisie libre ; catalogue : liste des villes une fois un pays choisi. Ajouter un pays = une ligne dans `COUNTRIES`.

## Back-office complet (backoffice.backmarket-ci.com)
Menu vertical à gauche : tableau de bord KPI (période 7/30/90 j, filtre pays, alertes « À traiter »), demandes partenaires, boutiques par pays de création, paiements partenaires (paiement direct marchand, suivi ORZAYAH, remboursements), mise en avant (`featured_offers`, ciblage pays + dates + rang), publicités (`ads`, créées par l'admin uniquement, emplacements `home_top` / `home_inline`, ciblage pays, dates, vues/clics), avis clients (modération), affichage du site. API : `server/routes/backoffice.ts` (admin seulement).

## Vitrine : engagement
- « À la une » : `GET /offers/featured?country=` + badge sur la carte.
- Publicités : `GET /ads?country=` (pays vide = tous ; pays inconnu = annonces non ciblées), vue comptée une fois par session au défilement, clic via `POST /ads/:id/click`, mention « Publicité / Sponsorisé ».
- Favoris : table `favorites`, cœur sur chaque carte, page `/favoris`.
- Avis : table `reviews` (un par réservation, uniquement commande livrée), étoiles sur les cartes, liste sur la page offre, formulaire dans « Mes réservations ».

## Administrateurs pays et langue du back-office
- `users.admin_country` : `null` = administrateur général (tous les pays) ; un code pays = administrateur pays. Le périmètre est lu à chaque requête admin (`server/lib/scope.ts`) et imposé côté serveur : KPI, boutiques, paiements, avis, publicités (pays forcé), mises en avant, demandes partenaires, crédits. Hors périmètre : 403. L'affichage global du site et la gestion des administrateurs pays restent réservés à l'administrateur général. Les alertes d'un pays vont aux administrateurs généraux et à ceux de ce pays.
- Langue : `src/lib/i18n.tsx` (clé = texte français, valeur = anglais ; texte absent = français). Drapeaux 🇫🇷 / 🇬🇧 sur le site et dans le back-office.
