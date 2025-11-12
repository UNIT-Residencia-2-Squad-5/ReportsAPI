import type { FileKeyResult, ReportSummary } from "@/types/reports.types"

/**
 * Interface para Repositório de Relatórios
 * Define o contrato para operações de persistência de dados de relatório.
 */
export interface IReportsRepository {
  /**
   * Cria uma nova solicitação de relatório no banco de dados.
   * @param turmaId - Identificador de turma
   * @param tipoRelatorio - Tipo de relatório a ser gerado
   * @returns Promise que resolve para o ID da solicitação criada
   */
  createRequest(turmaId: string, tipoRelatorio: string): Promise<string>

  /**
   * Valida se uma turma existe no banco de dados.
   * @param turmaId -   Identificador de turma
   * @returns   Promise que resolve para true se a turma existir, false caso contrário
   */
  validateTurmaExists(turmaId: string): Promise<boolean>

  /**
   *    Atualiza o status de uma solicitação de relatório
   * @param id -        Identificador da solicitação de relatório
   * @param status -    Novo status para a solicitação
   * @returns   Promise que resolve quando a atualização estiver completa
   */
  updateStatus(id: string, status: string): Promise<void>

  /**
   *    Recupera o status de uma solicitação de relatório
   * @param id -    Identificador da solicitação de relatório
   * @returns   Promise que resolve para o status atual ou null se não encontrado
   */
  getStatus(id: string): Promise<string | null>

  /**
   *    Insere metadados do relatório gerado no banco de dados
   * @param data -  Dados dos metadados do relatório
   * @returns   Promise que resolve quando a inserção estiver completa
   */
  insertMetadados(
    solicitacaoId: string,
    turmaId: string,
    tipoRelatorio: string,
    nomeArquivo: string,
    fileKey: string,
  ): Promise<void>

  /**
   *    Recupera a chave do arquivo e nome do relatório gerado por ID da solicitação
   * @param solicitacaoId -     Identificador da solicitação de relatório
   * @returns   Promise que resolve para os dados do arquivo ou null se não encontrado
   */
  getFileKeyBySolicitacaoId(solicitacaoId: string): Promise<FileKeyResult | null>

  /**
   *    Recupera todos os resumos de relatórios
   * @returns   Promise que resolve para uma lista de resumos de relatórios
   */
  getAll(): Promise<ReportSummary[]>
  getWorkload(): Promise<string[] | null>
}
