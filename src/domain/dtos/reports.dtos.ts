import { IsString, IsNotEmpty, IsIn, validate } from "class-validator"

export class CreateReportDTO {
  @IsString({ message: "turmaId deve ser uma string" })
  @IsNotEmpty({ message: "turmaId é obrigatório" })
  turmaId!: string

  @IsString({ message: "tipoRelatorio deve ser uma string" })
  @IsNotEmpty({ message: "tipoRelatorio é obrigatório" })
  @IsIn(["pdf", "excel", "workload_excel", "workload_pdf"], { message: 'tipoRelatorio deve ser ["pdf", "excel", "workload_excel", "workload_pdf"]' })
  tipoRelatorio!: string
}

export async function validateDTO<T extends object>(
  dtoClass: new () => T,
  plainObject: any,
): Promise<{ isValid: boolean; errors: string[] }> {
  const dto = Object.assign(new dtoClass(), plainObject)
  const validationErrors = await validate(dto)

  if (validationErrors.length > 0) {
    const errors = validationErrors.map((error) =>
      Object.values(error.constraints || {}).join(", "),
    )
    return { isValid: false, errors }
  }

  return { isValid: true, errors: [] }
}
