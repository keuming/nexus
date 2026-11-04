import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { v } from '../lib/validate.js';
import { notifications } from '../db/schema.js';
import { requireRole, type Env } from '../middleware/auth.js';

export const notificationRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  .get('/', async (c) => {
    const db = c.get('db');
    const uid = c.get('user')!.id;
    const [rows, [u]] = await Promise.all([
      db.select({ id: notifications.id, kind: notifications.kind, title: notifications.title, body: notifications.body, link: notifications.link, readAt: notifications.readAt, createdAt: notifications.createdAt })
        .from(notifications).where(eq(notifications.userId, uid)).orderBy(desc(notifications.createdAt)).limit(30),
      db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, uid), isNull(notifications.readAt))),
    ]);
    return c.json({ notifications: rows, unread: u.n });
  })
  /** Marque comme lues les alertes indiquées (ou toutes si `ids` est omis). */
  .post('/read', v('json', z.object({ ids: z.array(z.string().uuid()).max(100).optional() })), async (c) => {
    const { ids } = c.req.valid('json');
    await c.get('db').update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.userId, c.get('user')!.id), isNull(notifications.readAt), ids ? inArray(notifications.id, ids) : undefined));
    return c.json({ ok: true });
  });
