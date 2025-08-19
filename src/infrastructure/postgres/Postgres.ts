import { Pool } from 'pg';

export class Postgres {
  private static pool?: Pool;

  static init() {
    if (!Postgres.pool) {
      Postgres.pool = new Pool({
        host: process.env.PG_HOST,
        port: Number(process.env.PG_PORT),
        database: process.env.PG_DATABASE!,
        user: process.env.PG_USER!,
        password: String(process.env.PG_PASSWORD),
        max: 10,
        idleTimeoutMillis: 30_000,
      });
    }
    return Postgres.pool;
  }

  static getPool() {
    if (!Postgres.pool) throw new Error('Postgres pool not initialized');
    return Postgres.pool;
  }

  static async ping() {
    const r = await Postgres.getPool().query('SELECT 1');
    return r.rowCount === 1;
  }

  static async end() {
    if (Postgres.pool) {            
        await Postgres.pool.end();     
        this.pool = undefined;
    }
  }
}
