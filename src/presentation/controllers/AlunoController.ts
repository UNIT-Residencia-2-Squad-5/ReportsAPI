import type { Request, Response } from "express"
import { Postgres } from "@/infrastructure/postgres/Postgres"
import { AlunoService } from "@/domain/services/AlunoService"
import { NotFoundError } from "@/domain/errors/DomainErrors"

export class AlunoController {
  // Lista todos os alunos com paginação
  static async list(req: Request, res: Response) {
    const service = new AlunoService(Postgres.getPool())
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 20)

    try {
      const { data, total } = await service.list(page, pageSize)
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
        message: "Erro ao listar alunos",
      })
    }
  }

  // Busca um aluno por ID
  static async getById(req: Request, res: Response) {
    const service = new AlunoService(Postgres.getPool())

    try {
      const aluno = await service.getById(req.params.id)
      return res.json({
        success: true,
        data: aluno,
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
        message: "Erro ao buscar aluno",
      })
    }
  }
}
