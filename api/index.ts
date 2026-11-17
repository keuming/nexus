import { getRequestListener } from '@hono/node-server';
import { Hono } from 'hono';
import { createApp } from '../server/app.js';
import { getDb } from '../server/db/client.js';
import { shareRoutes } from '../server/routes/share.js';

const api = createApp(getDb);
// Une seule fonction serverless : l'API (/api/*) et les aperçus de partage pour les robots (/ et /offre/:id, cf. vercel.json).
const root = new Hono();
root.route('/', shareRoutes(getDb));
root.all('*', (c) => api.fetch(c.req.raw));
export default getRequestListener(root.fetch);
