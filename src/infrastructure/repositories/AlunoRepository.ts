import type { Pool } from "pg"
import type { IAlunoRepository } from "@/types/interfaces/IAlunoRepository"
import type { Aluno, ListAlunosOptions, ListAlunosResult } from "@/types/aluno.types"

export class AlunoRepository implements IAlunoRepository {
  constructor(private readonly pool: Pool) {}

  async list(opts: ListAlunosOptions): Promise<ListAlunosResult> {
    const { limit, offset } = opts

    const [rows, count] = await Promise.all([
      this.pool.query(`SELECT id, nome, email FROM alunos ORDER BY nome ASC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.pool.query(`SELECT COUNT(*)::int AS total FROM alunos`),
    ])

    const data: Aluno[] = rows.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
    }))

    return { data, total: count.rows[0].total as number }
  }

  async findById(id: string): Promise<Aluno | null> {
    const result = await this.pool.query(`SELECT id, nome, email FROM alunos WHERE id = $1`, [id])

    if (!result.rowCount) return null

    const row = result.rows[0]
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
    }
  }

  async findByTurmaId(turmaId: string): Promise<Aluno[]> {
    // Busca alunos que têm participações na turma (DISTINCT para evitar duplicatas)
    const result = await this.pool.query(
      `SELECT DISTINCT a.id, a.nome, a.email 
       FROM alunos a
       INNER JOIN participacoes p ON a.id = p.aluno_id
       WHERE p.turma_id = $1
       ORDER BY a.nome`,
      [turmaId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
    }))
  }
}
