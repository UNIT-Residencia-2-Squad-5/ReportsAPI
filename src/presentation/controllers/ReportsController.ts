import type { Request, Response } from "express"
import { ReportsService } from "@/domain/services/ReportsService"
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors"
import { Postgres } from "@/infrastructure/postgres/Postgres"

const service = new ReportsService(Postgres.getPool())

export class ReportsController {
  /**
   * Rota POST /reports
   * Cria uma nova solicitação de relatório.
   */
  static async create(req: Request, res: Response) {
    try {
      const solicitacaoId = await service.create(req.body)

      return res.status(202).json({
        success: true,
        data: {
          solicitacaoId,
        },
        message: "Solicitação de relatório criada com sucesso",
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        })
      }

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  /**
   * Rota GET /reports/:id/status
   * Retorna o status da solicitação.
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await service.getStatus(req.params.id)

      return res.status(200).json({
        success: true,
        data: {
          status,
        },
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message,
        })
      }

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  /**
   * Rota GET /reports/:id/download
   * Retorna o link temporário para download do relatório.
   */
  static async download(req: Request, res: Response) {
    try {
      const downloadUrl = await service.getDownloadUrl(req.params.id)

      return res.status(200).json({
        success: true,
        data: {
          downloadUrl,
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        })
      }

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }
}
