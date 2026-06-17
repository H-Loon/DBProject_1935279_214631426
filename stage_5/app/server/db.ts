/**
 * db.ts - PostgreSQL connection pool (the only place that touches `pg`).
 * Reads credentials from the .env file (see .env.example).
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Keep DATE values as plain 'YYYY-MM-DD' strings (default would be a JS Date,
// which can shift a day across timezones and breaks <input type="date"> prefill).
pg.types.setTypeParser(1082, (v) => v);

export const CONFIG = {
  localSchema: process.env.LOCAL_SCHEMA || 'public',
  remoteSchema: process.env.REMOTE_SCHEMA || 'remote_logistics',
  serverPort: Number(process.env.SERVER_PORT || 4000),
  appUser: process.env.APP_USER || 'admin',
  appPassword: process.env.APP_PASSWORD || 'admin',
};

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl:
    (process.env.PGSSLMODE || 'require') === 'disable'
      ? false
      : { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

/** Run a query and return rows + column names (in order). */
export async function query(text: string, params: any[] = []) {
  const res = await pool.query({ text, values: params, rowMode: 'array' });
  const columns = res.fields.map((f) => f.name);
  return { columns, rows: res.rows as any[][] };
}

/** Run a query and return rows as objects. */
export async function queryObjects(text: string, params: any[] = []) {
  const res = await pool.query(text, params);
  return res.rows as any[];
}

/** Quick connectivity probe used by the /api/health endpoint. */
export async function ping() {
  await pool.query('SELECT 1');
}
