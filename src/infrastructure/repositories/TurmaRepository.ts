import type { Pool } from "pg"

export class TurmaRepository {
  constructor(private readonly pool: Pool) {}

  async validateTurmaExists(turmaId: string): Promise<boolean> {
    const result = await this.pool.query(`SELECT COUNT(*) as count FROM participacoes WHERE turma_id = $1`, [turmaId])
    return Number.parseInt(result.rows[0].count) > 0
  }
}
