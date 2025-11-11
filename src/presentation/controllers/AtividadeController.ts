import type { Request, Response } from "express"
import { Postgres } from "@/infrastructure/postgres/Postgres"
import { AtividadeService } from "@/domain/services/AtividadeService"
import { NotFoundError } from "@/domain/errors/DomainErrors"

export class AtividadeController {
  // Lista todas as atividades com paginação e filtro opcional por turma
  static async list(req: Request, res: Response) {
    const service = new AtividadeService(Postgres.getPool())
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 20)
    const turmaId = req.query.turmaId as string | undefined

    try {
      const { data, total } = await service.list(page, pageSize, turmaId)
      return res.json({
        success: true,
        data: {
          total,
          page,
          pageSize,
          items: data,
        },
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar atividades",
      })
    }
  }

  // Busca uma atividade por ID
  static async getById(req: Request, res: Response) {
    const service = new AtividadeService(Postgres.getPool())

    try {
      const atividade = await service.getById(req.params.id)
      return res.json({
        success: true,
        data: atividade,
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
        message: "Erro ao buscar atividade",
      })
    }
  }
}
