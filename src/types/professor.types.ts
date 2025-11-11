// Turma Repository Types
export interface ValidateTurmaExistsParams {
  turmaId: string
}

export interface Turma {
  id: string
  nome: string
}

export interface TurmaComProfessores extends Turma {
  professores: Array<{
    id: string
    nome: string
    departamento: string
  }>
}

export interface ListTurmasOptions {
  limit: number
  offset: number
}

export interface ListTurmasResult {
  data: Turma[]
  total: number
}
