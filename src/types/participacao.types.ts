// Tipos para Participação
export interface Participacao {
  id: string
  aluno_id: string
  atividade_id: string
  turma_id: string
  presenca: boolean
  horas: number
  nota: number
  conceito: string
  status_avaliacao: string
  workload_real?: string
  workload_simulated?: string
  acts_workload_real?: string
  shifts_workload_real?: string
  practices_workload_real?: string
  acts_workload_simulated?: string
  practices_workload_simulated?: string
}

export interface ListParticipacoesOptions {
  limit: number
  offset: number
  turma_id?: string
  aluno_id?: string
  atividade_id?: string
}

export interface ListParticipacoesResult {
  data: Participacao[]
  total: number
}
