import type { Pool } from "pg"

export class ReportsRepository {
  constructor(private readonly pool: Pool) {}

  async createRequest(turmaId: string, tipoRelatorio: string): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO solicitacoes_relatorio (turma_id, tipo_relatorio, status)
       VALUES ($1, $2, 'pendente')
       RETURNING id`,
      [turmaId, tipoRelatorio],
    )
    return result.rows[0].id
  }

  async validateTurmaExists(turmaId: string): Promise<boolean> {
    const result = await this.pool.query(`SELECT COUNT(*) as count FROM participacoes WHERE turma_id = $1`, [turmaId])
    return Number.parseInt(result.rows[0].count) > 0
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.pool.query(`UPDATE solicitacoes_relatorio SET status = $1 WHERE id = $2`, [status, id])
  }

  async getStatus(id: string): Promise<string | null> {
    const result = await this.pool.query(`SELECT status FROM solicitacoes_relatorio WHERE id = $1`, [id])
    return result.rows[0]?.status ?? null
  }

  async insertMetadados(
    solicitacaoId: string,
    turmaId: string,
    tipoRelatorio: string,
    nomeArquivo: string,
    fileKey: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO relatorios_gerados (
        solicitacao_id,
        turma_id,
        tipo_relatorio,
        nome_arquivo,
        file_key
      ) VALUES ($1, $2, $3, $4, $5)`,
      [solicitacaoId, turmaId, "excel", nomeArquivo, fileKey],
    )
  }

  async getFileKeyBySolicitacaoId(solicitacaoId: string): Promise<{ file_key: string; nome_arquivo: string } | null> {
    const result = await this.pool.query(
      `SELECT file_key, nome_arquivo FROM relatorios_gerados
      WHERE solicitacao_id = $1`,
      [solicitacaoId],
    )
    return result.rows[0] ?? null
  }
}
