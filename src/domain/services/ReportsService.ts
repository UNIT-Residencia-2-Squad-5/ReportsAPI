import { ReportsRepository } from "@/infrastructure/repositories/ReportsRepository"
import { TurmaRepository } from "@/infrastructure/repositories/TurmaRepository"
import { enqueueReportJob } from "@/queue/reports.queue"
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors"
import type { Pool } from "pg"

export class ReportsService {
  private readonly repo: ReportsRepository
  private readonly turmaRepo: TurmaRepository

  constructor(pool: Pool) {
    this.repo = new ReportsRepository(pool)
    this.turmaRepo = new TurmaRepository(pool)
  }

  /**
   * Cria uma solicitação de relatório.
   */
  async create(data: { turmaId?: string; tipoRelatorio?: string }): Promise<string> {
    // Validar campos obrigatórios
    if (!data.turmaId || !data.tipoRelatorio) {
      throw new ValidationError("turmaId e tipoRelatorio são obrigatórios")
    }

    // Validar que turmaId existe
    const turmaExists = await this.turmaRepo.validateTurmaExists(data.turmaId)
    if (!turmaExists) {
      throw new ValidationError(`Turma com ID ${data.turmaId} não encontrada`)
    }

    // Inserir nova solicitação no banco com status "pendente"
    const solicitacaoId = await this.repo.createRequest(data.turmaId, data.tipoRelatorio)

    // Enfileirar o job
    await enqueueReportJob({ turmaId: data.turmaId, solicitacaoId })

    return solicitacaoId
  }

  /**
   * Retorna o status de uma solicitação.
   *
   * TODO:
   * 1. Consultar status da solicitação via `this.repo.getStatus(...)`
   * 2. Se status for `null` ou vazio, lançar `NotFoundError`
   * 3. Retornar o status encontrado
   */
  async getStatus(solicitacaoId: string): Promise<string> {
    // 1. Consultar status da solicitação
    const status = await this.repo.getStatus(solicitacaoId)

    // 2. Se status for null ou vazio, lançar NotFoundError
    if (!status) {
      throw new NotFoundError(`Solicitação com ID ${solicitacaoId} não encontrada`)
    }

    // 3. Retornar o status encontrado
    return status
  }

  /**
   * Gera uma URL temporária para download do relatório.
   *
   * TODO:
   * 1. Buscar status da solicitação via `this.repo.getStatus(...)`
   * 2. Se não for "concluido", lançar `ValidationError`
   * 3. Buscar o `fileKey` e `nomeArquivo` com `this.repo.getFileKeyBySolicitacaoId(...)`
   * 4. Se não encontrar, lançar `ValidationError`
   * 5. Importar `S3Storage` dinamicamente e retornar `presignGetUrl(...)` com TTL de 300 segundos
   */
  async getDownloadUrl(solicitacaoId: string): Promise<string> {
    // 1. Buscar status da solicitação
    const status = await this.repo.getStatus(solicitacaoId)

    // 2. Se não for "concluido", lançar ValidationError
    if (status !== "concluido") {
      throw new ValidationError(`Relatório ainda não está pronto. Status atual: ${status || "não encontrado"}`)
    }

    // 3. Buscar o fileKey e nomeArquivo
    const fileData = await this.repo.getFileKeyBySolicitacaoId(solicitacaoId)

    // 4. Se não encontrar, lançar ValidationError
    if (!fileData) {
      throw new ValidationError(`Arquivo do relatório não encontrado para a solicitação ${solicitacaoId}`)
    }

    // 5. Importar S3Storage dinamicamente e retornar presignGetUrl
    const { S3Storage } = await import("@/infrastructure/object-storage/S3Storage")
    const s3 = new S3Storage()

    return await s3.presignGetUrl(fileData.file_key, 300, fileData.nome_arquivo)
  }
}
