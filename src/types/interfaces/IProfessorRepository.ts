/**
 * Interface para Professor Repository
 * Define o contrato para operações de acesso a dados relacionadas a professores.
 */

export type ListProfessoresOptions = {
  limit: number
  offset: number
}

export interface IProfessorRepository {
  list(opts: ListProfessoresOptions): Promise<string[]>
  findById(id: string): Promise<string | null>
  findByTurmaId(turmaId: string): Promise<string[]>
}
