import type { Pool } from "pg"
import { ParticipacaoRepository } from "@/infrastructure/repositories/ParticipacaoRepository"
import { NotFoundError } from "@/domain/errors/DomainErrors"
import type { IParticipacaoRepository } from "@/types/interfaces/IParticicacaoRepository"
import type { Participacao, ListParticipacoesResult } from "@/types/participacao.types"

export class ParticipacaoService {
  private readonly repo: IParticipacaoRepository

  constructor(pool: Pool) {
    this.repo = new ParticipacaoRepository(pool)
  }

  async list(
    page = 1,
    pageSize = 20,
    filters?: { turmaId?: string; alunoId?: string; atividadeId?: string },
  ): Promise<ListParticipacoesResult> {
    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit

    return await this.repo.list({
      limit,
      offset,
      turma_id: filters?.turmaId,
      aluno_id: filters?.alunoId,
      atividade_id: filters?.atividadeId,
    })
  }

  async getById(id: string): Promise<Participacao> {
    const participacao = await this.repo.findById(id)
    if (!participacao) throw new NotFoundError("Participação não encontrada")
    return participacao
  }
}
