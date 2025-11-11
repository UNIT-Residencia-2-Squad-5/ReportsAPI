import type { Pool } from "pg"
import { AlunoRepository } from "@/infrastructure/repositories/AlunoRepository"
import { NotFoundError } from "@/domain/errors/DomainErrors"
import type { IAlunoRepository } from "@/types/interfaces/IAlunoRepository"
import type { Aluno, ListAlunosResult } from "@/types/aluno.types"

export class AlunoService {
  private readonly repo: IAlunoRepository

  constructor(pool: Pool) {
    this.repo = new AlunoRepository(pool)
  }

  async list(page = 1, pageSize = 20): Promise<ListAlunosResult> {
    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit
    return await this.repo.list({ limit, offset })
  }

  async getById(id: string): Promise<Aluno> {
    const aluno = await this.repo.findById(id)
    if (!aluno) throw new NotFoundError("Aluno não encontrado")
    return aluno
  }
}
