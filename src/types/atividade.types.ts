// Tipos para Atividade
export interface Atividade {
  id: string
  nome: string
  tipo: string
  turma_id: string
}

export interface ListAtividadesOptions {
  limit: number
  offset: number
  turma_id?: string
}

export interface ListAtividadesResult {
  data: Atividade[]
  total: number
}
