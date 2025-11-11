import type { Pool } from "pg"
import type { IAtividadeRepository } from "@/types/interfaces/IAtividadeRepository"
import type { Atividade, ListAtividadesOptions, ListAtividadesResult } from "@/types/atividade.types"

export class AtividadeRepository implements IAtividadeRepository {
  constructor(private readonly pool: Pool) {}

  async list(opts: ListAtividadesOptions): Promise<ListAtividadesResult> {
    const { limit, offset, turma_id } = opts

    // Query base
    let query = `SELECT id, nome, tipo, turma_id FROM atividades`
    let countQuery = `SELECT COUNT(*)::int AS total FROM atividades`
    const params: any[] = []

    // Adiciona filtro por turma se fornecido
    if (turma_id) {
      query += ` WHERE turma_id = $1`
      countQuery += ` WHERE turma_id = $1`
      params.push(turma_id)
    }

    query += ` ORDER BY nome ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const [rows, count] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, turma_id ? [turma_id] : []),
    ])

    const data: Atividade[] = rows.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      tipo: row.tipo,
      turma_id: row.turma_id,
    }))

    return { data, total: count.rows[0].total as number }
  }

  async findById(id: string): Promise<Atividade | null> {
    const result = await this.pool.query(`SELECT id, nome, tipo, turma_id FROM atividades WHERE id = $1`, [id])

    if (!result.rowCount) return null

    const row = result.rows[0]
    return {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo,
      turma_id: row.turma_id,
    }
  }
}
