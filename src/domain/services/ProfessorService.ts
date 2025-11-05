import type { Pool } from "pg"
import { ProfessorRepository } from "@/infrastructure/repositories/ProfessorRepository"
import { NotFoundError } from "@/domain/errors/DomainErrors"
import type { IProfessorRepository } from "@/types/interfaces/IProfessorRepository"
import type { Professor, ListProfessoresResult } from "@/types/professor.types"

export class ProfessorService {
  private readonly repo: IProfessorRepository

  constructor(pool: Pool) {
    this.repo = new ProfessorRepository(pool)
  }

  async list(page = 1, pageSize = 20): Promise<ListProfessoresResult> {
    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit
    return await this.repo.list({ limit, offset })
  }

  async getById(id: string): Promise<Professor> {
    const professor = await this.repo.findById(id)
    if (!professor) throw new NotFoundError("Professor não encontrado")
    return professor
  }
}
