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
    try {
      // 1. Receber turmaId e tipoRelatorio do req.body
      const { turmaId, tipoRelatorio } = req.body

      // 2. Chamar service.create e retornar solicitacaoId com status 202
      const solicitacaoId = await service.create({ turmaId, tipoRelatorio })

      return res.status(202).json({
        success: true,
        data: {
          solicitacaoId,
        },
        message: "Solicitação de relatório criada com sucesso",
      })
    } catch (error) {
      // 3. Lidar com ValidationError retornando 400
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        })
      }

      // 4. Lidar com demais erros retornando 500
      console.error("Erro ao criar solicitação de relatório:", error)
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
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
    try {
      // 1. Obter id do req.params
      const { id } = req.params

      // 2. Chamar service.getStatus e retornar o status
      const status = await service.getStatus(id)

      return res.status(200).json({
        success: true,
        data: {
          status,
        },
      })
    } catch (error) {
      // 3. Lidar com NotFoundError retornando 404
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message,
        })
      }

      // 4. Lidar com demais erros retornando 500
      console.error("Erro ao consultar status da solicitação:", error)
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
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
    try {
      // 1. Obter id do req.params
      const { id } = req.params

      // 2. Chamar service.getDownloadUrl e retornar downloadUrl
      const downloadUrl = await service.getDownloadUrl(id)

      return res.status(200).json({
        success: true,
        data: {
          downloadUrl,
        },
      })
    } catch (error) {
      // 3. Lidar com ValidationError retornando 400
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        })
      }

      // 4. Lidar com demais erros retornando 500
      console.error("Erro ao gerar URL de download:", error)
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }
}
