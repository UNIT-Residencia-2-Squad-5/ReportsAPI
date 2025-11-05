import type { Pool } from "pg"
import type { IParticipacaoRepository } from "@/types/interfaces/IParticicacaoRepository"
import type { Participacao, ListParticipacoesOptions, ListParticipacoesResult } from "@/types/participacao.types"

export class ParticipacaoRepository implements IParticipacaoRepository {
  constructor(private readonly pool: Pool) {}

  async list(opts: ListParticipacoesOptions): Promise<ListParticipacoesResult> {
    const { limit, offset, turma_id, aluno_id, atividade_id } = opts

    // Query base
    let query = `SELECT 
      id, aluno_id, atividade_id, turma_id, presenca, horas, nota, conceito, status_avaliacao,
      workload_real, workload_simulated, acts_workload_real, shifts_workload_real,
      practices_workload_real, acts_workload_simulated, practices_workload_simulated
      FROM participacoes`
    let countQuery = `SELECT COUNT(*)::int AS total FROM participacoes`

    const whereClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Adiciona filtros dinamicamente
    if (turma_id) {
      whereClauses.push(`turma_id = $${paramIndex++}`)
      params.push(turma_id)
    }
    if (aluno_id) {
      whereClauses.push(`aluno_id = $${paramIndex++}`)
      params.push(aluno_id)
    }
    if (atividade_id) {
      whereClauses.push(`atividade_id = $${paramIndex++}`)
      params.push(atividade_id)
    }

    // Aplica WHERE se houver filtros
    if (whereClauses.length > 0) {
      const whereClause = ` WHERE ${whereClauses.join(" AND ")}`
      query += whereClause
      countQuery += whereClause
    }

    query += ` ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const [rows, count] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2)), // Remove limit e offset do count
    ])

    const data: Participacao[] = rows.rows.map((row) => ({
      id: row.id,
      aluno_id: row.aluno_id,
      atividade_id: row.atividade_id,
      turma_id: row.turma_id,
      presenca: row.presenca,
      horas: Number.parseFloat(row.horas),
      nota: Number.parseFloat(row.nota),
      conceito: row.conceito,
      status_avaliacao: row.status_avaliacao,
      workload_real: row.workload_real,
      workload_simulated: row.workload_simulated,
      acts_workload_real: row.acts_workload_real,
      shifts_workload_real: row.shifts_workload_real,
      practices_workload_real: row.practices_workload_real,
      acts_workload_simulated: row.acts_workload_simulated,
      practices_workload_simulated: row.practices_workload_simulated,
    }))

    return { data, total: count.rows[0].total as number }
  }

  async findById(id: string): Promise<Participacao | null> {
    const result = await this.pool.query(
      `SELECT 
        id, aluno_id, atividade_id, turma_id, presenca, horas, nota, conceito, status_avaliacao,
        workload_real, workload_simulated, acts_workload_real, shifts_workload_real,
        practices_workload_real, acts_workload_simulated, practices_workload_simulated
       FROM participacoes WHERE id = $1`,
      [id],
    )

    if (!result.rowCount) return null

    const row = result.rows[0]
    return {
      id: row.id,
      aluno_id: row.aluno_id,
      atividade_id: row.atividade_id,
      turma_id: row.turma_id,
      presenca: row.presenca,
      horas: Number.parseFloat(row.horas),
      nota: Number.parseFloat(row.nota),
      conceito: row.conceito,
      status_avaliacao: row.status_avaliacao,
      workload_real: row.workload_real,
      workload_simulated: row.workload_simulated,
      acts_workload_real: row.acts_workload_real,
      shifts_workload_real: row.shifts_workload_real,
      practices_workload_real: row.practices_workload_real,
      acts_workload_simulated: row.acts_workload_simulated,
      practices_workload_simulated: row.practices_workload_simulated,
    }
  }
}
