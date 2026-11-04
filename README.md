# NEXUS (MVP)

Réservations multi-activités. Stack : Vite + React + Tailwind · Hono · Drizzle · Neon Postgres · Vercel.

## Démarrage local
```bash
npm install
cp .env.example .env            # renseigner DATABASE_URL et JWT_SECRET
export $(grep -v '^#' .env | xargs)
npm run migrate                 # applique db/schema.sql
ADMIN_EMAIL=vous@exemple.com ADMIN_PASSWORD='mot-de-passe-12+' npm run seed:admin
npm run dev:api &  npm run dev  # API :8787, web :5173 (proxy /api)
```
## Qualité
`npm run check` = typecheck + tests (PGlite) + build.

## Déploiement Vercel
1. Pousser sur GitHub, importer le dépôt dans Vercel (preset Vite détecté).
2. Variables d'environnement : `DATABASE_URL` (URL **pooled** Neon), `JWT_SECRET` (≥ 32 car.).
3. Exécuter `db/schema.sql` dans l'éditeur SQL de Neon (ou `npm run migrate`), puis `npm run seed:admin`.
