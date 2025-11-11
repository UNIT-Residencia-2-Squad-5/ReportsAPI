/**
 * Interface para Atividade Repository
 * Define o contrato para operações de acesso a dados relacionadas a atividades.
 */

import type { Atividade, ListAtividadesOptions, ListAtividadesResult } from "@/types/atividade.types"

export interface IAtividadeRepository {
  list(opts: ListAtividadesOptions): Promise<ListAtividadesResult>
  findById(id: string): Promise<Atividade | null>
}
