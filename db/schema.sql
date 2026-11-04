-- NEXUS MVP — schéma PostgreSQL (Neon). Idempotent : peut être rejoué sans risque.
begin;

do $$ begin
  create type user_role as enum ('admin','owner','customer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type company_status as enum ('pending','active','suspended');
exception when duplicate_object then null; end $$;
do $$ begin
  create type booking_status as enum ('confirmed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  name          text not null,
  role          user_role not null default 'customer',
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_uq on users (lower(email));

create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete restrict,
  name        text not null,
  activity    text not null check (activity in
    ('transport','restauration','expedition','hotel','boutique','agence_voyage','residence_meuble','loisirs','location_vente')),
  city        text not null,
  status      company_status not null default 'pending',
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
  status      booking_status not null default 'confirmed',
  created_at  timestamptz not null default now()
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

commit;
