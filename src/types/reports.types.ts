// Reports Repository Types
export interface CreateReportRequestData {
  turmaId: string
  tipoRelatorio: string
}

export interface InsertMetadadosData {
  solicitacaoId: string
  turmaId: string
  tipoRelatorio: string
  nomeArquivo: string
  fileKey: string
}

export interface FileKeyResult {
  file_key: string
  nome_arquivo: string
}

export interface ReportSummary {
  id: string
  turma_id: string
  tipo_relatorio: string
  status: string
}

// Reports Service Types
export interface CreateReportInput {
  turmaId?: string
  tipoRelatorio?: string
}