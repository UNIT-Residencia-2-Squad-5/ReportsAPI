import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import ExcelJS from "exceljs"
import { PassThrough } from "stream"

const LOGGER = getLogger()

export async function generateReportXLSX(turmaId: string, fileKey: string) {
  const client = await Postgres.getPool().connect()
  const s3 = new S3Storage()

  try {
    const sql = `
      SELECT
        a.id AS aluno_id,
        a.nome AS aluno,
        a.email,
        at.nome AS atividade,
        at.tipo,
        p.presenca,
        p.horas,
        p.nota,
        p.conceito,
        p.status_avaliacao
      FROM participacoes p
      JOIN alunos a ON a.id = p.aluno_id
      JOIN atividades at ON at.id = p.atividade_id
      WHERE p.turma_id = $1
      ORDER BY a.nome
    `

    const result = await client.query(sql, [turmaId])

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Relatório")

    sheet.columns = [
      { header: "Aluno", key: "aluno", width: 25 },
      { header: "Email", key: "email", width: 28 },
      { header: "Atividade", key: "atividade", width: 25 },
      { header: "Nota", key: "nota", width: 10 },
      { header: "Conceito", key: "conceito", width: 12 },
      { header: "Presença", key: "presenca", width: 12 },
      { header: "Horas", key: "horas", width: 10 },
      { header: "Status Avaliação", key: "status_avaliacao", width: 22 },
    ]

    const titleText = `Relatório da Turma ${turmaId} — Gerado em ${new Date().toLocaleString("pt-BR")}`
    sheet.spliceRows(1, 0, [titleText])
    sheet.mergeCells(1, 1, 1, sheet.columns.length)
    const titleCell = sheet.getCell("A1")
    titleCell.font = { size: 16, bold: true, color: { argb: "FF1F497D" } }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    const headerRow = sheet.getRow(2)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F497D" } } as any
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true } as any
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF9CC2E5" } },
        left: { style: "thin", color: { argb: "FF9CC2E5" } },
        bottom: { style: "thin", color: { argb: "FF9CC2E5" } },
        right: { style: "thin", color: { argb: "FF9CC2E5" } },
      } as any
    })

    sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }]
    sheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: sheet.columns.length },
    } as any

    result.rows.forEach((row) => sheet.addRow(row))

    const firstDataRow = 3
    sheet.getColumn("nota").numFmt = "0.00"
    sheet.getColumn("horas").numFmt = "0.00"
    sheet.getColumn("presenca").alignment = { horizontal: "center" } as any
    sheet.getColumn("status_avaliacao").alignment = { horizontal: "center" } as any
    ;["aluno", "atividade", "conceito", "email"].forEach((key) => {
      sheet.getColumn(key as any).alignment = { horizontal: "left" } as any
    })

    for (let r = firstDataRow; r <= sheet.rowCount; r++) {
      if (r % 2 === 0) {
        sheet.getRow(r).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } as any
        })
      }
    }

    for (let r = 2; r <= sheet.rowCount; r++) {
      sheet.getRow(r).eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFDDDDDD" } },
          left: { style: "thin", color: { argb: "FFDDDDDD" } },
          bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
          right: { style: "thin", color: { argb: "FFDDDDDD" } },
        } as any
      })
    }

    const emailColIndex = sheet.columns.findIndex((c: any) => c.key === "email") + 1
    if (emailColIndex > 0) {
      for (let r = firstDataRow; r <= sheet.rowCount; r++) {
        const cell = sheet.getRow(r).getCell(emailColIndex)
        const email = String(cell.value ?? "")
        if (email.includes("@")) {
          cell.value = { text: email, hyperlink: `mailto:${email}` } as any
          ;(cell as any).font = { color: { argb: "FF0563C1" }, underline: true }
        }
      }
    }

    sheet.columns?.forEach((col: any) => {
      let max = col.header ? String(col.header).length : 10
      col.eachCell({ includeEmpty: false }, (cell: any) => {
        const len = cell.value ? String(cell.value.text ?? cell.value).length : 0
        if (len > max) max = len
      })
      col.width = Math.min(Math.max(max + 2, 10), 50)
    })

    sheet.headerFooter.oddHeader = '&C&K1F497D&"Calibri,Bold" Relatório da Turma &"Calibri" ' + turmaId
    sheet.headerFooter.oddFooter = "&LGerado em &D &T &RPágina &P de &N"
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
    } as any

    const passthroughStream = new PassThrough()

    const uploadPromise = s3.uploadStreamMultipart(
      fileKey,
      passthroughStream,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

    await workbook.xlsx.write(passthroughStream)
    passthroughStream.end()

    await uploadPromise

    LOGGER.info(`Relatório XLSX da turma ${turmaId} salvo com sucesso`)
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório XLSX", err)
    throw err
  } finally {
    client.release()
  }
}
