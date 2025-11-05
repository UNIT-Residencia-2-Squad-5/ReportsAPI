/**
 * Interface para Participacao Repository
 * Define o contrato para operações de acesso a dados relacionadas a participações.
 */

import type { Participacao, ListParticipacoesOptions, ListParticipacoesResult } from "@/types/participacao.types"

export interface IParticipacaoRepository {
  list(opts: ListParticipacoesOptions): Promise<ListParticipacoesResult>
  findById(id: string): Promise<Participacao | null>
}
