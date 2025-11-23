import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import { PassThrough } from "stream"
import ExcelJS from "exceljs"
import { readQuery } from "@/utils/ReadQuery"

const LOGGER = getLogger()

export async function generateReportWorkloadXLSX(
  turmaId: string,
  fileKey: string,
) {
  const client = await Postgres.getPool().connect()
  const s3 = new S3Storage()

  try {
    const sql = readQuery("workload.sql")
    const queryResult = await client.query(sql, [turmaId])

    if (!queryResult.rows.length) {
      throw new Error("Nenhum dado encontrado para workloads.")
    }

    const alunos = queryResult.rows

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Workloads")

    // =============================
    // COLUNAS
    // =============================
    sheet.columns = [
      { header: "Aluno", key: "aluno", width: 30 },
      { header: "ID", key: "id" },
      { header: "Total (s)", key: "total_segundos", width: 16 },
      { header: "Total Horas", key: "total_horas", width: 20 },
      { header: "Horas Real", key: "horas_real", width: 20 },
      { header: "Horas Simuladas", key: "horas_simulada", width: 22 },
      { header: "Média Horas/Turma", key: "media_turma", width: 24 },
      { header: "Participações", key: "total_part", width: 18 },
      { header: "Presenças", key: "total_pres", width: 18 },
      { header: "Taxa Presença", key: "taxa_presenca", width: 20 },
      { header: "Média Nota", key: "media_nota", width: 18 },
    ]

    // =============================
    // TÍTULO
    // =============================
    sheet.mergeCells("A1:K1")
    sheet.getCell("A1").value = `Relatório de Workloads — Turma ${turmaId}`
    sheet.getCell("A1").font = { size: 16, bold: true }
    sheet.getCell("A1").alignment = { horizontal: "center" }
    sheet.getRow(1).height = 25

    // Congelar até o cabeçalho
    sheet.views = [{ state: "frozen", ySplit: 3 }]

    // =============================
    // CONVERTER EM DADOS DE TABELA
    // =============================
    const tableRows: any[][] = alunos.map((aluno: any) => {
      return [
        aluno.aluno_nome,
        aluno.aluno_id,
        aluno.total_segundos ?? null,
        formatInterval(aluno.total_horas),
        formatInterval(aluno.horas_real),
        formatInterval(aluno.horas_simulada),
        formatInterval(aluno.media_turma),
        aluno.total_participacoes,
        aluno.total_presencas,
        aluno.taxa_presenca ?? null,
        aluno.media_nota ?? null,
      ]
    })

    // =============================
    // CRIAR TABELA EXCEL
    // =============================
    sheet.addTable({
      name: "WorkloadTable",
      ref: "A3",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium9",
        showRowStripes: true,
      },
      columns: [
        { name: "Aluno", filterButton: true },
        { name: "ID", filterButton: true },
        { name: "Total (s)", filterButton: true },
        { name: "Total Horas", filterButton: true },
        { name: "Horas Real", filterButton: true },
        { name: "Horas Simuladas", filterButton: true },
        { name: "Média Horas/Turma", filterButton: true },
        { name: "Participações", filterButton: true },
        { name: "Presenças", filterButton: true },
        { name: "Taxa Presença", filterButton: true },
        { name: "Média Nota", filterButton: true },
      ],
      rows: tableRows,
    })

    // =============================
    // FORMATAÇÃO NUMÉRICA
    // =============================
    sheet.getColumn("B").numFmt = "0"       // ID
    sheet.getColumn("C").numFmt = "0"       // Total (s)
    sheet.getColumn("D").numFmt = "hh:mm:ss" // Total Horas
    sheet.getColumn("E").numFmt = "hh:mm:ss" // Horas Real
    sheet.getColumn("F").numFmt = "hh:mm:ss" // Horas Simuladas
    sheet.getColumn("G").numFmt = "hh:mm:ss" // Média Horas/Turma
    sheet.getColumn("H").numFmt = "0"       // Participações
    sheet.getColumn("I").numFmt = "0"       // Presenças
    sheet.getColumn("J").numFmt = "0.0%"    // Taxa Presença
    sheet.getColumn("K").numFmt = "0.00"    // Média Nota

    // =============================
    // EXPORTAÇÃO PARA S3
    // =============================
    const passthrough = new PassThrough()

    const uploadPromise = s3.uploadStreamMultipart(
      fileKey,
      passthrough,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    await workbook.xlsx.write(passthrough)
    passthrough.end()

    await uploadPromise

    LOGGER.info(`[WORKLOADS] XLSX da turma ${turmaId} salvo em ${fileKey}`)
  } catch (error) {
    LOGGER.error("Erro ao gerar relatório Workloads XLSX:", error)
    throw error
  } finally {
    client.release()
  }
}

function formatInterval(value: any): string {
  if (!value) return "-"
  return String(value)
}
