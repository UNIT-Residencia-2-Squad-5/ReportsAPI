import type { CreateReportInput } from "@/types/reports.types"

/**
 *  Interface para reports service
 *  Define o contrato para operações de serviço relacionadas a relatórios.
 */
export interface IReportsService {
  /**
   *    Cria uma nova solicitação de relatório
   * @param data -  Dados de entrada para criação do relatório
   * @returns   Promise que resolve para o ID da solicitação criada
   * @throws    ValidationError se os dados forem inválidos
   */
  create(data: CreateReportInput): Promise<string>

  /**
   *    Recupera o status de uma solicitação de relatório
   * @param solicitacaoId - Identificador da solicitação de relatório
   * @returns   Promise que resolve para o status atual
   * @throws    NotFoundError se a solicitação não for encontrada
   */
  getStatus(solicitacaoId: string): Promise<string>

  /**
   *    Recupera a URL de download do relatório gerado
   * @param solicitacaoId -     Identificador da solicitação de relatório
   * @returns   Promise que resolve para a URL de download
   * @throws    ValidationError se o relatório não estiver pronto ou não for encontrado
   */
  getDownloadUrl(solicitacaoId: string): Promise<string>
}
