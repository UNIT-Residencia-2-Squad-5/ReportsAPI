import { ReportsRepository } from "@/infrastructure/repositories/ReportsRepository";
import { enqueueReportJob } from "@/queue/reports.queue";
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors";
import { Pool } from "pg";

export class ReportsService {
  private readonly repo: ReportsRepository;

  constructor(pool: Pool) {
    this.repo = new ReportsRepository(pool);
  }

  /**
    * Cria uma solicitação de relatório.
    * 
    * TODO:
    * 1. Desestruturar `turmaId` e `tipoRelatorio` de `data`
    * 2. Validar que `turmaId` existe — se não, lançar `ValidationError`
    * 3. Inserir nova solicitação no banco com status "pendente" via `this.repo.createRequest(...)`
    * 4. Enfileirar o job com `enqueueReportJob({ turmaId, solicitacaoId })`
    * 5. Retornar o `solicitacaoId`
  */
  async create(data: { turmaId?: string; tipoRelatorio?: string }): Promise<string> {
    // TODO: Implementar criação da solicitação
    throw new Error("Not implemented");
  }

  /**
     * Retorna o status de uma solicitação.
     * 
     * TODO:
     * 1. Consultar status da solicitação via `this.repo.getStatus(...)`
     * 2. Se status for `null` ou vazio, lançar `NotFoundError`
     * 3. Retornar o status encontrado
  */
  async getStatus(solicitacaoId: string): Promise<string> {
    // TODO: Implementar consulta de status
    throw new Error("Not implemented");
  }

  /**
    * Gera uma URL temporária para download do relatório.
    * 
    * TODO:
    * 1. Buscar status da solicitação via `this.repo.getStatus(...)`
    * 2. Se não for "concluido", lançar `ValidationError`
    * 3. Buscar o `fileKey` e `nomeArquivo` com `this.repo.getFileKeyBySolicitacaoId(...)`
    * 4. Se não encontrar, lançar `ValidationError`
    * 5. Importar `S3Storage` dinamicamente e retornar `presignGetUrl(...)` com TTL de 300 segundos
  */
  async getDownloadUrl(solicitacaoId: string): Promise<string> {
    // TODO: Implementar geração da URL de download
    throw new Error("Not implemented");
  }
}
