import { ReportsRepository } from "@/infrastructure/repositories/ReportsRepository"
import { TurmaRepository } from "@/infrastructure/repositories/TurmaRepository"
import { enqueueReportJob } from "@/queue/reports.queue"
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors"
import type { Pool } from "pg"
import type { IReportsService } from "@/types/interfaces/IReportsService"
import type { IReportsRepository } from "@/types/interfaces/IReportsRepository"
import type { ITurmaRepository } from "@/types/interfaces/ITurmaRepository"
import type { CreateReportInput, ReportSummary } from "@/types/reports.types"

// Remover validações de tipo e manter apenas validações de regras de negócio
export class ReportsService implements IReportsService {
  private readonly repo: IReportsRepository
  private readonly turmaRepo: ITurmaRepository

  constructor(pool: Pool) {
    this.repo = new ReportsRepository(pool)
    this.turmaRepo = new TurmaRepository(pool)
  }

  async create(data: CreateReportInput): Promise<string> {
    if (!data.turmaId || !data.tipoRelatorio) {
      throw new ValidationError("turmaId e tipoRelatorio são obrigatórios")
    }

    const turmaExists = await this.turmaRepo.validateTurmaExists(data.turmaId)
    if (!turmaExists) {
      throw new ValidationError(`Turma com ID ${data.turmaId} não encontrada`)
    }

    const solicitacaoId = await this.repo.createRequest(data.turmaId, data.tipoRelatorio)

    await enqueueReportJob({ turmaId: data.turmaId, solicitacaoId, tipoRelatorio: data.tipoRelatorio })

    return solicitacaoId
  }

  async getStatus(solicitacaoId: string): Promise<string> {
    const status = await this.repo.getStatus(solicitacaoId)

    if (!status) {
      throw new NotFoundError(`Solicitação com ID ${solicitacaoId} não encontrada`)
    }

    return status
  }

  async getDownloadUrl(solicitacaoId: string): Promise<string> {
    const status = await this.repo.getStatus(solicitacaoId)

    if (status !== "concluido") {
      throw new ValidationError(`Relatório ainda não está pronto. Status atual: ${status || "não encontrado"}`)
    }

    const fileData = await this.repo.getFileKeyBySolicitacaoId(solicitacaoId)

    if (!fileData) {
      throw new ValidationError(`Arquivo do relatório não encontrado para a solicitação ${solicitacaoId}`)
    }

    const { S3Storage } = await import("@/infrastructure/object-storage/S3Storage")
    const s3 = new S3Storage()

    return await s3.presignGetUrl(fileData.file_key, 300, fileData.nome_arquivo)
  }

  async getAllReports(): Promise<ReportSummary[]> {
    return this.repo.getAll();
  }
}

