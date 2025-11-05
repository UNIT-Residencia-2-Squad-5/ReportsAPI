import type { Pool } from "pg"
import { AtividadeRepository } from "@/infrastructure/repositories/AtividadeRepository"
import { NotFoundError } from "@/domain/errors/DomainErrors"
import type { IAtividadeRepository } from "@/types/interfaces/IAtividadeRepository"
import type { Atividade, ListAtividadesResult } from "@/types/atividade.types"

export class AtividadeService {
  private readonly repo: IAtividadeRepository

  constructor(pool: Pool) {
    this.repo = new AtividadeRepository(pool)
  }

  async list(page = 1, pageSize = 20, turmaId?: string): Promise<ListAtividadesResult> {
    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit
    return await this.repo.list({ limit, offset, turma_id: turmaId })
  }

  async getById(id: string): Promise<Atividade> {
    const atividade = await this.repo.findById(id)
    if (!atividade) throw new NotFoundError("Atividade não encontrada")
    return atividade
  }
}
