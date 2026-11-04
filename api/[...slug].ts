import { getRequestListener } from '@hono/node-server';
import { createApp } from '../server/app.js';
import { getDb } from '../server/db/client.js';

// Une seule fonction serverless pour toute l'API (/api/*).
export default getRequestListener(createApp(getDb).fetch);
