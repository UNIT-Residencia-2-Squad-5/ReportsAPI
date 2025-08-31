import { Pool } from 'pg';

export class Postgres {
  private static pool?: Pool;

  static init() {
    if (!Postgres.pool) {
      const databaseUrl = process.env.DATABASE_URL?.trim();
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not defined in the environment");
      }
      Postgres.pool = new Pool({ connectionString: databaseUrl, max: 10, idleTimeoutMillis: 30_000 });
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
