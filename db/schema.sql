-- BackMarket MVP — schéma PostgreSQL (Neon). Idempotent : peut être rejoué sans risque.
begin;

do $$ begin
  create type user_role as enum ('admin','owner','customer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type company_status as enum ('pending','active','suspended','rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type booking_status as enum ('confirmed','cancelled','pending_payment');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  name          text not null,
  phone         text not null default '',
  role          user_role not null default 'customer',
  admin_country text,
  created_at    timestamptz not null default now()
);
alter table users add column if not exists admin_country text;
alter table users add column if not exists disabled_at timestamptz;
alter table users add column if not exists last_login_at timestamptz;
alter table users add column if not exists orz_account text;
create table if not exists admin_audit (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  user_name  text not null default '',
  country    text,
  method     text not null,
  path       text not null,
  status     integer not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on admin_audit (created_at desc);
create index if not exists admin_audit_user_idx on admin_audit (user_id, created_at desc);
create unique index if not exists users_email_uq on users (lower(email));

create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete restrict,
  name        text not null,
  activity    text not null check (activity in
    ('transport','restauration','expedition','hotel','boutique','agence_voyage','residence_meuble','loisirs','location_vente','smartphones','laptops','tablets','mode','beaute')),
  country     text not null default 'CI',
  city        text not null,
  service_cities text[] not null default '{}',
  phone       text not null default '',
  rccm        text not null default '',
  address     text not null default '',                          -- quartier / rue / repère
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  email       text not null default '',                          -- e-mail de l'entreprise
  manager_title text not null default '',                        -- fonction du gérant
  status      company_status not null default 'pending',
  review_note text not null default '',          -- motif de la décision de l'administrateur
  reviewed_at timestamptz,
  reviewed_by uuid references users(id) on delete set null,
  credits     integer not null default 0 check (credits >= 0),
  created_at  timestamptz not null default now()
);
-- MVP : une entreprise par propriétaire
create unique index if not exists companies_owner_uq on companies (owner_id);
create index if not exists companies_status_idx on companies (status);

create table if not exists offers (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  country      text not null default 'CI',      -- pays de destination / de service
  city         text not null default '',        -- ville de départ (transport) ou de service
  stops        text[] not null default '{}',    -- arrêts / lieux indiqués par le fournisseur
  price_fcfa   integer not null check (price_fcfa >= 0),
  capacity     integer not null check (capacity > 0),
  booked       integer not null default 0,
  starts_at    timestamptz not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint offers_booked_ck check (booked >= 0 and booked <= capacity)
);
create index if not exists offers_company_idx on offers (company_id);
create index if not exists offers_catalog_idx on offers (starts_at) where active;

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references offers(id) on delete restrict,
  company_id  uuid not null references companies(id) on delete restrict,
  user_id     uuid not null references users(id) on delete restrict,
  seats       integer not null default 1 check (seats > 0),
  stop        text,                              -- arrêt choisi par le client
  status      booking_status not null default 'confirmed',
  created_at  timestamptz not null default now(),
  reference     text not null default ('NX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),  -- n° de réservation présenté au fournisseur
  contact_name  text,                              -- personne qui réserve (peut différer du titulaire du compte)
  contact_phone text,
  contact_email text,
  guests        text[] not null default '{}',      -- noms des passagers / participants
  note          text not null default '',          -- demande particulière
  terms_accepted_at timestamptz
);
create index if not exists bookings_user_idx on bookings (user_id, created_at desc);
create index if not exists bookings_company_idx on bookings (company_id, created_at desc);
create index if not exists bookings_offer_idx on bookings (offer_id);

-- Journal des crédits : 1 crédit = 125 FCFA. Source de vérité pour l'audit.
create table if not exists credit_ledger (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  delta       integer not null check (delta <> 0),
  reason      text not null check (reason in ('topup','booking','refund','adjustment')),
  booking_id  uuid references bookings(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists ledger_company_idx on credit_ledger (company_id, created_at desc);

-- Alertes (cloche + e-mail optionnel) : nouvelles réservations, nouvelles demandes partenaires, remboursements à faire.
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  ref_id     uuid,                                   -- objet concerné (réservation, entreprise, paiement) : évite les doublons
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create unique index if not exists notifications_dedupe on notifications (user_id, kind, ref_id) where ref_id is not null;

-- Photos des offres (4 max) : URL Cloudinary (`url`) ou, à défaut, JPEG en base64 (`data`).
create table if not exists offer_photos (
  offer_id uuid not null references offers(id) on delete cascade,
  position smallint not null check (position between 0 and 3),
  data     text,
  url      text,
  primary key (offer_id, position),
  check (data is not null or url is not null)
);
-- Mise à niveau si la table existait déjà (v6)
alter table offer_photos add column if not exists url text;
alter table offer_photos alter column data drop not null;

-- Paiements des réservations via l'API ORZAYAH (dépôt Mobile Money).
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references bookings(id) on delete restrict,
  company_id      uuid not null references companies(id) on delete restrict,
  user_id         uuid not null references users(id) on delete restrict,
  amount_fcfa     integer not null check (amount_fcfa > 0),
  operator        text not null default 'ORZAYAH',
  account_number  text not null default '',                     -- numéro Mobile Money débité (jamais renvoyé en clair)
  idempotency_key text not null unique,                -- clé envoyée à ORZAYAH : protège contre les doubles débits
  status          text not null default 'pending' check (status in ('pending','paid','failed','expired','needs_refund','refunded')),
  orz_ref         text,
  orz_status      text,
  fee_centimes    bigint,
  failure_reason  text,
  next_action     jsonb,
  expires_at      timestamptz not null,
  last_checked_at timestamptz,
  paid_at         timestamptz,
  reversed_at     timestamptz,                         -- date du reversement au fournisseur
  pay_url         text,                                -- page de paiement ORZAYAH
  return_url      text,
  created_at      timestamptz not null default now()
);
create index if not exists payments_company_idx on payments (company_id, status);
create index if not exists payments_user_idx on payments (user_id, created_at desc);
create index if not exists payments_open_idx on payments (expires_at) where status in ('pending','expired');

-- Mise à niveau d'une base existante (sans effet sur une base neuve).
alter type company_status add value if not exists 'rejected';
alter type booking_status add value if not exists 'pending_payment';
alter table companies add column if not exists country text not null default 'CI';
alter table companies add column if not exists service_cities text[] not null default '{}';
alter table users     add column if not exists phone text not null default '';
alter table companies add column if not exists phone text not null default '';
alter table companies add column if not exists address text not null default '';
alter table companies add column if not exists latitude double precision check (latitude between -90 and 90);
alter table companies add column if not exists longitude double precision check (longitude between -180 and 180);
alter table companies add column if not exists email text not null default '';
alter table companies add column if not exists manager_title text not null default '';
alter table companies add column if not exists rccm text not null default '';
alter table companies add column if not exists review_note text not null default '';
alter table companies add column if not exists reviewed_at timestamptz;
alter table companies add column if not exists reviewed_by uuid references users(id) on delete set null;
alter table offers    add column if not exists country text not null default 'CI';
alter table offers    add column if not exists city text not null default '';
alter table offers    add column if not exists stops text[] not null default '{}';
alter table bookings  add column if not exists stop text;
create index if not exists offers_geo_idx on offers (country, city) where active;

-- ===== Crédits : commandes verrouillées (boutique sans crédit) et achat de crédit en ligne =====
-- Tant que `credit_lock_until` est renseigné, aucun crédit n'a été débité et le partenaire ne voit aucun détail ; passé ce délai, la commande est attribuée à une autre boutique.
alter table bookings add column if not exists credit_lock_until timestamptz;
alter table bookings add column if not exists tried_company_ids uuid[] not null default '{}';
create index if not exists bookings_lock_idx on bookings (credit_lock_until) where credit_lock_until is not null;
create table if not exists credit_purchases (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  credits         integer not null check (credits > 0),
  amount_fcfa     integer not null check (amount_fcfa > 0),
  status          text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  idempotency_key text not null unique,
  orz_ref         text,
  pay_url         text,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);
create index if not exists credit_purchases_company_idx on credit_purchases (company_id, created_at desc);

commit;

-- v13 : parcours de réservation (référence, contact, passagers, note, acceptation des conditions)
alter table bookings add column if not exists reference text not null default ('NX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table bookings add column if not exists contact_name text;
alter table bookings add column if not exists contact_phone text;
alter table bookings add column if not exists contact_email text;
alter table bookings add column if not exists guests text[] not null default '{}';
alter table bookings add column if not exists note text not null default '';
alter table bookings add column if not exists terms_accepted_at timestamptz;
create unique index if not exists bookings_reference_uq on bookings (reference);

-- v17 : nouvelles activités (smartphones, laptops, tablettes)
alter table companies drop constraint if exists companies_activity_check;
alter table companies add constraint companies_activity_check check (activity in
  ('transport','restauration','expedition','hotel','boutique','agence_voyage','residence_meuble','loisirs','location_vente','smartphones','laptops','tablets'));

-- v18 : planification de l'affichage
create table if not exists activity_display (
  activity   text primary key,
  visible    boolean not null default true,
  show_from  timestamptz,
  show_until timestamptz
);
alter table offers add column if not exists admin_hidden boolean not null default false;
alter table offers add column if not exists show_from timestamptz;
alter table offers add column if not exists show_until timestamptz;

-- v26 : activités mode et beauté
alter table companies drop constraint if exists companies_activity_check;
alter table companies add constraint companies_activity_check check (activity in
  ('transport','restauration','expedition','hotel','boutique','agence_voyage','residence_meuble','loisirs','location_vente','smartphones','laptops','tablets','mode','beaute'));

-- v31 : transport — pays et ville d'arrivée (country/city = départ)
alter table offers add column if not exists dest_country text;
alter table offers add column if not exists dest_city text;

-- v32 : catégorie d'offre (cuisine, type de colis, type de billet, type de chambre/logement)
alter table offers add column if not exists category text;

-- v33 : logo de l'entreprise (URL Cloudinary)
alter table companies add column if not exists logo_url text;

-- v34 : mode de paiement de la réservation (digital = Mobile Money/carte via ORZAYAH ; cash = à la livraison)
alter table bookings add column if not exists pay_method text not null default 'digital';
-- Prix unitaire figé à la réservation (un changement de prix ultérieur ne modifie pas les commandes existantes).
alter table bookings add column if not exists unit_price_fcfa integer;
-- Paiement direct au marchand : chaque marchand relie son propre compte ORZAYAH (clés chiffrées par l'application).
alter table companies add column if not exists orz_api_key_enc text;
alter table companies add column if not exists orz_webhook_secret_enc text;
alter table companies add column if not exists orz_connected_at timestamptz;
alter table payments add column if not exists orz_scope text not null default 'platform';
update bookings b set unit_price_fcfa = o.price_fcfa from offers o where o.id = b.offer_id and b.unit_price_fcfa is null;

-- v35 : le fournisseur autorise (ou non) le paiement à la livraison pour chaque offre
alter table offers add column if not exists allow_cash boolean not null default true;

-- v44 : paiement par lien ORZAYAH (Mobile Money, carte, wallet) au lieu du dépôt direct.
alter table payments add column if not exists pay_url text;
alter table payments add column if not exists return_url text;
alter table payments drop constraint if exists payments_operator_check;
alter table payments alter column operator set default 'ORZAYAH';
alter table payments alter column account_number set default '';

-- v45 : suivi de commande par le fournisseur (préparation, retrait/livraison, encaissement, notes, annulation motivée).
alter table bookings add column if not exists fulfillment text not null default 'new';
alter table bookings add column if not exists merchant_note text not null default '';
alter table bookings add column if not exists cancel_reason text;
alter table bookings add column if not exists cancelled_by text;
alter table bookings add column if not exists cash_collected_at timestamptz;
alter table bookings add column if not exists updated_at timestamptz not null default now();

-- v46 : pays du marchand = marché ; portée nationale / internationale du marchand et de ses articles.
alter table companies add column if not exists scopes text[] not null default '{national}';
alter table offers add column if not exists scope text not null default 'national';
alter table offers add column if not exists can_ship_international boolean not null default false;
create index if not exists companies_country_idx on companies (country);

-- ===== Back-office complet : mise en avant, publicités, favoris, avis =====
-- Offres « À la une » (choisies par l'admin) : pays ciblés (vide = tous), fenêtre de dates, rang.
create table if not exists featured_offers (
  offer_id   uuid primary key references offers(id) on delete cascade,
  countries  text[] not null default '{}',
  starts_at  timestamptz,
  ends_at    timestamptz,
  rank       integer not null default 0,
  created_at timestamptz not null default now()
);
-- Publicités de partenaires (dont gaRAN) affichées sur la vitrine selon le pays ; vues et clics comptés.
create table if not exists ads (
  id         uuid primary key default gen_random_uuid(),
  advertiser text not null,
  title      text not null,
  body       text not null default '',
  image_url  text,
  link_url   text not null,
  cta_label  text not null default 'Découvrir',
  slot       text not null default 'home_top',
  countries  text[] not null default '{}',
  active     boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  views      integer not null default 0,
  clicks     integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists favorites (
  user_id    uuid not null references users(id) on delete cascade,
  offer_id   uuid not null references offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);
-- Avis : un seul par réservation, uniquement après livraison ; l'admin peut masquer.
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  offer_id   uuid not null references offers(id) on delete cascade,
  company_id uuid not null references companies(id),
  user_id    uuid not null references users(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text not null default '',
  status     text not null default 'published',
  created_at timestamptz not null default now()
);
create index if not exists reviews_offer_idx on reviews (offer_id, status);
