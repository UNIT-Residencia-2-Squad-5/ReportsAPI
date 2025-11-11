import type { Request, Response } from "express"
import { Postgres } from "@/infrastructure/postgres/Postgres"
import { ParticipacaoService } from "@/domain/services/ParticipacaoService"
import { NotFoundError } from "@/domain/errors/DomainErrors"

export class ParticipacaoController {
  // Lista todas as participações com paginação e filtros opcionais
  static async list(req: Request, res: Response) {
    const service = new ParticipacaoService(Postgres.getPool())
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 20)

    // Filtros opcionais via query params
    const filters = {
      turmaId: req.query.turmaId as string | undefined,
      alunoId: req.query.alunoId as string | undefined,
      atividadeId: req.query.atividadeId as string | undefined,
    }

    try {
      const { data, total } = await service.list(page, pageSize, filters)
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
        message: "Erro ao listar participações",
      })
    }
  }

  // Busca uma participação por ID
  static async getById(req: Request, res: Response) {
    const service = new ParticipacaoService(Postgres.getPool())

    try {
      const participacao = await service.getById(req.params.id)
      return res.json({
        success: true,
        data: participacao,
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
        message: "Erro ao buscar participação",
      })
    }
  }
}
