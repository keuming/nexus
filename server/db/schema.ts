import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'owner', 'customer']);
export const companyStatus = pgEnum('company_status', ['pending', 'active', 'suspended']);
export const bookingStatus = pgEnum('booking_status', ['confirmed', 'cancelled']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRole('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  activity: text('activity').notNull(),
  city: text('city').notNull(),
  status: companyStatus('status').notNull().default('pending'),
  credits: integer('credits').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
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
