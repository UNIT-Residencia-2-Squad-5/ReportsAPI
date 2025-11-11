/**
 *  Interface para Turma Repository
 *  Define o contrato para operações de acesso a dados relacionadas a turmas.
 */

import type { Turma, ListTurmasOptions, ListTurmasResult, TurmaComProfessores } from "@/types/turma.types"

export interface ITurmaRepository {
  /**
   *    Valida se uma turma existe no banco de dados.
   * @param turmaId -   Identificador de turma
   * @returns   Promise que resolve para true se a turma existir, false caso contrário
   */
  validateTurmaExists(turmaId: string): Promise<boolean>

  list(opts: ListTurmasOptions): Promise<ListTurmasResult>
  findById(id: string): Promise<Turma | null>
  findByIdWithProfessores(id: string): Promise<TurmaComProfessores | null>
}
