/**
 * Interface para Aluno Repository
 * Define o contrato para operações de acesso a dados relacionadas a alunos.
 */

import type { Aluno, ListAlunosOptions, ListAlunosResult } from "@/types/aluno.types"

export interface IAlunoRepository {
  list(opts: ListAlunosOptions): Promise<ListAlunosResult>
  findById(id: string): Promise<Aluno | null>
  findByTurmaId(turmaId: string): Promise<Aluno[]>
}
