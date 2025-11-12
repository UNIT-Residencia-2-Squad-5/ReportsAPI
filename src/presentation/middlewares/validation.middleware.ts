import type { Request, Response, NextFunction } from "express"
import { validateDTO, CreateReportDTO } from "../../domain/dtos/reports.dtos"

export async function validateReportCreation(req: Request, res: Response, next: NextFunction) {
  const { isValid, errors } = await validateDTO(CreateReportDTO, req.body)

  if (!isValid) {
    return res.status(422).json({
      success: false,
      error: "Validação de entrada falhou",
      details: errors,
    })
  }

  next()
}