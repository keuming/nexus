import { pgTable, primaryKey, smallint, uuid, text, integer, bigint, boolean, timestamp, pgEnum, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'owner', 'customer']);
export const companyStatus = pgEnum('company_status', ['pending', 'active', 'suspended', 'rejected']);
export const bookingStatus = pgEnum('booking_status', ['confirmed', 'cancelled', 'pending_payment']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  role: userRole('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  activity: text('activity').notNull(),
  country: text('country').notNull().default('CI'),
  city: text('city').notNull(),
  serviceCities: text('service_cities').array().notNull().default([]),
  phone: text('phone').notNull().default(''),
  rccm: text('rccm').notNull().default(''),
  address: text('address').notNull().default(''),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  email: text('email').notNull().default(''),
  managerTitle: text('manager_title').notNull().default(''),
  status: companyStatus('status').notNull().default('pending'),
  reviewNote: text('review_note').notNull().default(''),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  credits: integer('credits').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  country: text('country').notNull().default('CI'),
  city: text('city').notNull().default(''),
  stops: text('stops').array().notNull().default([]),
  priceFcfa: integer('price_fcfa').notNull(),
  capacity: integer('capacity').notNull(),
  booked: integer('booked').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').notNull().references(() => offers.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  seats: integer('seats').notNull().default(1),
  stop: text('stop'),
  status: bookingStatus('status').notNull().default('confirmed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable('credit_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().unique().references(() => bookings.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  amountFcfa: integer('amount_fcfa').notNull(),
  operator: text('operator').notNull(),
  accountNumber: text('account_number').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull().default('pending'),
  orzRef: text('orz_ref'),
  orzStatus: text('orz_status'),
  feeCentimes: bigint('fee_centimes', { mode: 'number' }),
  failureReason: text('failure_reason'),
  nextAction: jsonb('next_action'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  reversedAt: timestamp('reversed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const offerPhotos = pgTable('offer_photos', {
  offerId: uuid('offer_id').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  position: smallint('position').notNull(),
  data: text('data').notNull(),
}, (t) => [primaryKey({ columns: [t.offerId, t.position] })]);
