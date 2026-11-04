import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { getDb } from './db/client.js';

serve({ fetch: createApp(getDb).fetch, port: 8787 }, (i) => console.log(`API http://localhost:${i.port}/api`));
