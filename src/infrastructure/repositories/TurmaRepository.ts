import type { Pool } from "pg"
import type { ITurmaRepository } from "@/types/interfaces/ITurmaRepository"
import type { Turma, ListTurmasOptions, ListTurmasResult, TurmaComProfessores} from "@/types/professor.types"

export class TurmaRepository implements ITurmaRepository {
  constructor(private readonly pool: Pool) {}

  async validateTurmaExists(turmaId: string): Promise<boolean> {
    const result = await this.pool.query(`SELECT COUNT(*) as count FROM participacoes WHERE turma_id = $1`, [turmaId])
    return Number.parseInt(result.rows[0].count) > 0
  }

  async list(opts: ListTurmasOptions): Promise<ListTurmasResult> {
    const { limit, offset } = opts

    // Busca turmas e total em paralelo
    const [rows, count] = await Promise.all([
      this.pool.query(`SELECT id, nome FROM turmas ORDER BY nome ASC LIMIT $1 OFFSET $2`, [limit, offset]),
      this.pool.query(`SELECT COUNT(*)::int AS total FROM turmas`),
    ])

    const data: Turma[] = rows.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
    }))

    return { data, total: count.rows[0].total as number }
  }

  async findById(id: string): Promise<Turma | null> {
    const result = await this.pool.query(`SELECT id, nome FROM turmas WHERE id = $1`, [id])

    if (!result.rowCount) return null

    const row = result.rows[0]
    return {
      id: row.id,
      nome: row.nome,
    }
  }

  async findByIdWithProfessores(id: string): Promise<TurmaComProfessores | null> {
    // Busca turma e professores em uma única query com JOIN
    const result = await this.pool.query(
      `SELECT 
        t.id as turma_id,
        t.nome as turma_nome,
        p.id as professor_id,
        p.nome as professor_nome,
        p.departamento as professor_departamento
      FROM turmas t
      LEFT JOIN professor_turma pt ON t.id = pt.turma_id
      LEFT JOIN professores p ON pt.professor_id = p.id
      WHERE t.id = $1
      ORDER BY p.nome`,
      [id],
    )

    if (!result.rowCount) return null

    const firstRow = result.rows[0]
    const turma: TurmaComProfessores = {
      id: firstRow.turma_id,
      nome: firstRow.turma_nome,
      professores: [],
    }

    // Agrupa professores
    for (const row of result.rows) {
      if (row.professor_id) {
        turma.professores.push({
          id: row.professor_id,
          nome: row.professor_nome,
          departamento: row.professor_departamento,
        })
      }
    }

    return turma
  }
}