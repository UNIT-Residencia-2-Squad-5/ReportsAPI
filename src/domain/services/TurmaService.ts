import type { Pool } from "pg"
import { TurmaRepository } from "@/infrastructure/repositories/TurmaRepository"
import { ProfessorRepository } from "@/infrastructure/repositories/ProfessorRepository"
import { AlunoRepository } from "@/infrastructure/repositories/AlunoRepository"
import { AtividadeRepository } from "@/infrastructure/repositories/AtividadeRepository"
import { NotFoundError } from "@/domain/errors/DomainErrors"
import type { ITurmaRepository } from "@/types/interfaces/ITurmaRepository"
import type { IProfessorRepository } from "@/types/interfaces/IProfessorRepository"
import type { IAlunoRepository } from "@/types/interfaces/IAlunoRepository"
import type { IAtividadeRepository } from "@/types/interfaces/IAtividadeRepository"
import type { Turma, ListTurmasResult } from "@/types/turma.types"
import type { Professor } from "@/types/professor.types"
import type { Aluno } from "@/types/aluno.types"

export class TurmaService {
  private readonly turmaRepo: ITurmaRepository
  private readonly professorRepo: IProfessorRepository
  private readonly alunoRepo: IAlunoRepository
  private readonly atividadeRepo: IAtividadeRepository

  constructor(pool: Pool) {
    this.turmaRepo = new TurmaRepository(pool)
    this.professorRepo = new ProfessorRepository(pool)
    this.alunoRepo = new AlunoRepository(pool)
    this.atividadeRepo = new AtividadeRepository(pool)
  }

  async list(page = 1, pageSize = 20): Promise<ListTurmasResult> {
    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit
    return await this.turmaRepo.list({ limit, offset })
  }

  async getById(id: string): Promise<Turma> {
    const turma = await this.turmaRepo.findById(id)
    if (!turma) throw new NotFoundError("Turma não encontrada")
    return turma
  }

  async getProfessoresByTurmaId(turmaId: string): Promise<Professor[]> {
    // Valida se a turma existe
    const turma = await this.turmaRepo.findById(turmaId)
    if (!turma) throw new NotFoundError("Turma não encontrada")

    return await this.professorRepo.findByTurmaId(turmaId)
  }

  async getAlunosByTurmaId(turmaId: string): Promise<Aluno[]> {
    // Valida se a turma existe
    const turma = await this.turmaRepo.findById(turmaId)
    if (!turma) throw new NotFoundError("Turma não encontrada")

    return await this.alunoRepo.findByTurmaId(turmaId)
  }

  async getAtividadesByTurmaId(turmaId: string, page = 1, pageSize = 20) {
    // Valida se a turma existe
    const turma = await this.turmaRepo.findById(turmaId)
    if (!turma) throw new NotFoundError("Turma não encontrada")

    const limit = Math.max(1, Math.min(100, pageSize))
    const offset = (Math.max(1, page) - 1) * limit

    return await this.atividadeRepo.list({ limit, offset, turma_id: turmaId })
  }
}
