/**
 * Interface para Professor Repository
 * Define o contrato para operações de acesso a dados relacionadas a professores.
 */

import type { Professor, ListProfessoresOptions, ListProfessoresResult } from "@/types/professor.types"

export interface IProfessorRepository {
  list(opts: ListProfessoresOptions): Promise<ListProfessoresResult>
  findById(id: string): Promise<Professor | null>
  findByTurmaId(turmaId: string): Promise<Professor[]>
}
