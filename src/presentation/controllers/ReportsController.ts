import type { Request, Response } from "express"
import { ReportsService } from "@/domain/services/ReportsService"
import { ValidationError, NotFoundError } from "@/domain/errors/DomainErrors"
import { Postgres } from "@/infrastructure/postgres/Postgres"

const service = new ReportsService(Postgres.getPool())


// TODO: Usar class-validator para validar inputs, e deixar o response mais enxuto
export class ReportsController {
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

  static async getAllReports(req: Request, res: Response) {
    try {
      const reports = await service.getAllReports();

      return res.status(200).json({
        success: true,
        data: {
          reports,
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
https://github.com/UNIT-Residencia-2-Squad-5/ReportsAPI/pull/7/conflict?name=src%252Fpresentation%252Fcontrollers%252FReportsController.ts&ancestor_oid=a16cf77ccc69165900d7851336bd280113d45be0&base_oid=ac66f6965ceb8bbbbd2587ab3d701b43a38bb133&head_oid=0435d857ec9cdcb41b3ef3ae6eb9d55caffc2d97        })
      }

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  static async getWorkload(req: Request, res: Response) {
    try {
      const reports = await service.getWorkload();

      return res.status(200).json({
        success: true,
        data: {
          reports,
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
