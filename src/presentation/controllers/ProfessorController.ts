import type { Request, Response } from "express"
import { Postgres } from "@/infrastructure/postgres/Postgres"
import { ProfessorService } from "@/domain/services/ProfessorService"
import { NotFoundError } from "@/domain/errors/DomainErrors"

export class ProfessorController {
  // Lista todos os professores com paginação
  static async list(req: Request, res: Response) {
    const service = new ProfessorService(Postgres.getPool())
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 20)

    try {
      const response = await service.list(page, pageSize)
      return res.json({
        success: true,
        data: {
          total: response.length,
          page,
          pageSize,
          items: response,
        },
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar professores",
      })
    }
  }

  // Busca um professor por ID
  static async getById(req: Request, res: Response) {
    const service = new ProfessorService(Postgres.getPool())

    try {
      const professor = await service.getById(req.params.id)
      return res.json({
        success: true,
        data: professor,
      })
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar professor",
      })
    }
  }
}
