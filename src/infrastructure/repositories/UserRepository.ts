import { Pool } from "pg";
import { User } from "@/domain/entities/User";

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: { id: string; name: string; email: string; password_hash: string }): Promise<User> {
    const q = `
      INSERT INTO users (id, name, email, password_hash)
      VALUES ($1,$2,$3,$4)
      RETURNING id, name, email, password_hash, created_at, updated_at`;
    const r = await this.pool.query(q, [data.id, data.name, data.email, data.password_hash]);
    const row = r.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.updated_at);
  }

  async findById(id: string): Promise<User | null> {
    const r = await this.pool.query(
      `SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE id=$1`, [id]
    );
    if (!r.rowCount) return null;
    const row = r.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.updated_at);
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.pool.query(
      `SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email=$1`, [email]
    );
    if (!r.rowCount) return null;
    const row = r.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.updated_at);
  }

  async list(opts: { limit: number; offset: number }): Promise<{ data: User[]; total: number }> {
    const { limit, offset } = opts;
    const [rows, count] = await Promise.all([
      this.pool.query(
        `SELECT id, name, email, password_hash, created_at, updated_at 
         FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]
      ),
      this.pool.query(`SELECT COUNT(*)::int AS total FROM users`),
    ]);
    const data = rows.rows.map(row => new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.updated_at));
    return { data, total: count.rows[0].total as number };
  }

  async update(id: string, patch: { name?: string; email?: string; password_hash?: string }): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    // Normaliza nome e email
    if (patch.name !== undefined) patch.name = patch.name.trim();
    if (patch.email !== undefined) patch.email = patch.email.toLowerCase().trim();

    // Cria um set com placehoders dinâmicos 
    const set = (k: string, v: unknown) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      fields.push(`${k}=$${idx++}`); 
      values.push(v);
    };

    set('name', patch.name);
    set('email', patch.email);
    set('password_hash', patch.password_hash);

    fields.push(`updated_at=NOW()`);

    if (fields.length === 1) return await this.findById(id); 

    const q = `
      UPDATE users SET ${fields.join(', ')}
      WHERE id=$${idx}
      RETURNING id, name, email, password_hash, created_at, updated_at
    `;
    values.push(id);

    const r = await this.pool.query(q, values);
    if (!r.rowCount) return null;
    const row = r.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.updated_at);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM users WHERE id=$1', [id]);
    return rowCount === 1;
  }
}
