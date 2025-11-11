// Tipos para Aluno
export interface Aluno {
  id: string
  nome: string
  email: string
}

export interface ListAlunosOptions {
  limit: number
  offset: number
}

export interface ListAlunosResult {
  data: Aluno[]
  total: number
}
