import type { Request, Response } from "express"
import { Postgres } from "@/infrastructure/postgres/Postgres"
import { TurmaService } from "@/domain/services/TurmaService"
import { NotFoundError } from "@/domain/errors/DomainErrors"

export class TurmaController {
  // Lista todas as turmas com paginação
  static async list(req: Request, res: Response) {
    const service = new TurmaService(Postgres.getPool())
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
        message: "Erro ao listar turmas",
      })
    }
  }

  // Busca uma turma por ID
  static async getById(req: Request, res: Response) {
    const service = new TurmaService(Postgres.getPool())

    try {
      const turma = await service.getById(req.params.id)
      return res.json({
        success: true,
        data: turma,
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
        message: "Erro ao buscar turma",
      })
    }
  }

  // Lista professores de uma turma
  static async getProfessores(req: Request, res: Response) {
    const service = new TurmaService(Postgres.getPool())

    try {
      const professores = await service.getProfessoresByTurmaId(req.params.id)
      return res.json({
        success: true,
        data: professores,
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
        message: "Erro ao buscar professores da turma",
      })
    }
  }

  // Lista alunos de uma turma
  static async getAlunos(req: Request, res: Response) {
    const service = new TurmaService(Postgres.getPool())

    try {
      const alunos = await service.getAlunosByTurmaId(req.params.id)
      return res.json({
        success: true,
        data: alunos,
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
        message: "Erro ao buscar alunos da turma",
      })
    }
  }

  // Lista atividades de uma turma
  static async getAtividades(req: Request, res: Response) {
    const service = new TurmaService(Postgres.getPool())
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 20)

    try {
      const { data, total } = await service.getAtividadesByTurmaId(req.params.id, page, pageSize)
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
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar atividades da turma",
      })
    }
  }
}
