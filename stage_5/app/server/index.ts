/**
 * index.ts - Express backend entry point.
 * Exposes /api/* used by the React client (Vite proxies to here on :4000).
 */
import express from 'express';
import cors from 'cors';
import { CONFIG, ping } from './db.ts';
import { getSchema } from './schema.ts';
import crud from './crud.ts';
import queries from './queries.ts';
import subprograms from './subprograms.ts';
import shop from './shop.ts';

const app = express();
app.use(cors());
app.use(express.json());

/** App-level login (front door, not the DB role). */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === CONFIG.appUser && password === CONFIG.appPassword) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'Invalid username or password.' });
});

/** Health / connectivity probe (used by the login screen + status pill). */
app.get('/api/health', async (_req, res) => {
  try {
    await ping();
    res.json({ db: 'up' });
  } catch (e: any) {
    res.status(503).json({ db: 'down', error: e.message });
  }
});

/** Force a fresh introspection (handy after the integrated schema changes). */
app.post('/api/refresh-schema', async (_req, res) => {
  try {
    await getSchema(true);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api', crud);
app.use('/api', queries);
app.use('/api', subprograms);
app.use('/api', shop);

app.listen(CONFIG.serverPort, () => {
  console.log(`\n  NexusCommerce API ready on http://localhost:${CONFIG.serverPort}`);
  console.log(`  (React dev server proxies /api here)\n`);
});
