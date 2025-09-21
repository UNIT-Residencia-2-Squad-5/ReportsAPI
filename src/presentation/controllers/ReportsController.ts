import { Request, Response } from "express";
import { ReportsService } from "@/domain/services/ReportsService";
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors";
import { Postgres } from "@/infrastructure/postgres/Postgres";

const service = new ReportsService(Postgres.getPool());

export class ReportsController {

  /**
    * Rota POST /reports
    * Cria uma nova solicitação de relatório.
    *
    * TODO:
    * 1. Receber `turmaId` e `tipoRelatorio` do `req.body`
    * 2. Chamar `service.create(...)` e retornar `solicitacaoId` com status 202
    * 3. Lidar com `ValidationError` retornando 400
    * 4. Lidar com demais erros retornando 500
  */
  static async create(req: Request, res: Response) {
    // TODO: Implementar criação de solicitação
  }

  /**
    * Rota GET /reports/:id/status
    * Retorna o status da solicitação.
    *
    * TODO:
    * 1. Obter `id` do `req.params`
    * 2. Chamar `service.getStatus(...)` e retornar o `status`
    * 3. Lidar com `NotFoundError` retornando 404
    * 4. Lidar com demais erros retornando 500
  */ 
  static async getStatus(req: Request, res: Response) {
    // TODO: Implementar consulta de status
  }

  /**
    * Rota GET /reports/:id/download
    * Retorna o link temporário para download do relatório.
    *
    * TODO:
    * 1. Obter `id` do `req.params`
    * 2. Chamar `service.getDownloadUrl(...)` e retornar `downloadUrl`
    * 3. Lidar com `ValidationError` retornando 400
    * 4. Lidar com demais erros retornando 500
  */
  static async download(req: Request, res: Response) {
    // TODO: Implementar geração de link de download
  }
}
