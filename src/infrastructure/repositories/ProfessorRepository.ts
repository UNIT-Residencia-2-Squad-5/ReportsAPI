import type { Pool } from "pg"
import type { IProfessorRepository } from "@/types/interfaces/IProfessorRepository"
import type { Professor, ListProfessoresOptions, ListProfessoresResult } from "@/types/professor.types"

export class ProfessorRepository implements IProfessorRepository {
  constructor(private readonly pool: Pool) {}

  async list(opts: ListProfessoresOptions): Promise<ListProfessoresResult> {
    const { limit, offset } = opts

    const [rows, count] = await Promise.all([
      this.pool.query(`SELECT id, nome, departamento FROM professores ORDER BY nome ASC LIMIT $1 OFFSET $2`, [
        limit,
        offset,
      ]),
      this.pool.query(`SELECT COUNT(*)::int AS total FROM professores`),
    ])

    const data: Professor[] = rows.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      departamento: row.departamento,
    }))

    return { data, total: count.rows[0].total as number }
  }

  async findById(id: string): Promise<Professor | null> {
    const result = await this.pool.query(`SELECT id, nome, departamento FROM professores WHERE id = $1`, [id])

    if (!result.rowCount) return null

    const row = result.rows[0]
    return {
      id: row.id,
      nome: row.nome,
      departamento: row.departamento,
    }
  }

  async findByTurmaId(turmaId: string): Promise<Professor[]> {
    const result = await this.pool.query(
      `SELECT p.id, p.nome, p.departamento 
       FROM professores p
       INNER JOIN professor_turma pt ON p.id = pt.professor_id
       WHERE pt.turma_id = $1
       ORDER BY p.nome`,
      [turmaId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      departamento: row.departamento,
    }))
  }
}
