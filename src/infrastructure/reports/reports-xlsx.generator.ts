import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import ExcelJS from "exceljs"
import { PassThrough } from "stream"

const LOGGER = getLogger()

const THEME_COLORS = {
  primary: "FF2563EB", // Azul vibrante
  primaryDark: "FF1E40AF", // Azul escuro
  success: "FF10B981", // Verde para aprovado
  warning: "FFF59E0B", // Amarelo para atenção
  danger: "FFEF4444", // Vermelho para reprovado
  info: "FF06B6D4", // Ciano para informação
  headerBg: "FF1E293B", // Cinza escuro moderno
  headerText: "FFFFFFFF", // Branco
  rowEven: "FFF8FAFC", // Cinza muito claro
  rowOdd: "FFFFFFFF", // Branco
  border: "FFE2E8F0", // Cinza claro para bordas
  titleBg: "FF3B82F6", // Azul para título
}

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
    workbook.creator = "Sistema de Relatórios"
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.lastPrinted = new Date()

    const sheet = workbook.addWorksheet("Relatório", {
      properties: { tabColor: { argb: THEME_COLORS.primary } },
    })

    sheet.columns = [
      { header: "Aluno", key: "aluno", width: 28 },
      { header: "Email", key: "email", width: 32 },
      { header: "Atividade", key: "atividade", width: 28 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Nota", key: "nota", width: 10 },
      { header: "Conceito", key: "conceito", width: 12 },
      { header: "Presença", key: "presenca", width: 12 },
      { header: "Horas", key: "horas", width: 10 },
      { header: "Status", key: "status_avaliacao", width: 18 },
    ]

    const titleText = `📊 RELATÓRIO DE DESEMPENHO - TURMA ${turmaId}`
    const subtitleText = `Gerado em ${new Date().toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    })}`

    sheet.spliceRows(1, 0, [titleText])
    sheet.spliceRows(2, 0, [subtitleText])

    // Estilização do título principal
    sheet.mergeCells(1, 1, 1, sheet.columns.length)
    const titleCell = sheet.getCell("A1")
    titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: THEME_COLORS.titleBg },
    } as any
    sheet.getRow(1).height = 32

    // Estilização do subtítulo
    sheet.mergeCells(2, 1, 2, sheet.columns.length)
    const subtitleCell = sheet.getCell("A2")
    subtitleCell.font = { size: 11, italic: true, color: { argb: "FF64748B" } }
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(2).height = 20

    const headerRow = sheet.getRow(3)
    headerRow.font = { bold: true, size: 11, color: { argb: THEME_COLORS.headerText } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: THEME_COLORS.headerBg },
    } as any
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    } as any
    headerRow.height = 28

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "medium", color: { argb: THEME_COLORS.primaryDark } },
        left: { style: "thin", color: { argb: THEME_COLORS.border } },
        bottom: { style: "medium", color: { argb: THEME_COLORS.primaryDark } },
        right: { style: "thin", color: { argb: THEME_COLORS.border } },
      } as any
    })

    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }]
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: sheet.columns.length },
    } as any

    // Adiciona os dados
    result.rows.forEach((row) => sheet.addRow(row))

    const firstDataRow = 4

    sheet.getColumn("nota").numFmt = "0.00"
    sheet.getColumn("horas").numFmt = "0.00"

    // Alinhamentos
    sheet.getColumn("presenca").alignment = { horizontal: "center", vertical: "middle" } as any
    sheet.getColumn("status_avaliacao").alignment = { horizontal: "center", vertical: "middle" } as any
    sheet.getColumn("tipo").alignment = { horizontal: "center", vertical: "middle" } as any
    sheet.getColumn("nota").alignment = { horizontal: "center", vertical: "middle" } as any
    sheet.getColumn("conceito").alignment = { horizontal: "center", vertical: "middle" } as any
    ;["aluno", "atividade", "email"].forEach((key) => {
      sheet.getColumn(key as any).alignment = { horizontal: "left", vertical: "middle" } as any
    })

    for (let r = firstDataRow; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      row.height = 22

      if (r % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: THEME_COLORS.rowEven },
          } as any
        })
      }
    }

    for (let r = 3; r <= sheet.rowCount; r++) {
      sheet.getRow(r).eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: THEME_COLORS.border } },
          left: { style: "thin", color: { argb: THEME_COLORS.border } },
          bottom: { style: "thin", color: { argb: THEME_COLORS.border } },
          right: { style: "thin", color: { argb: THEME_COLORS.border } },
        } as any
      })
    }

    const conceitoColIndex = sheet.columns.findIndex((c: any) => c.key === "conceito") + 1
    const statusColIndex = sheet.columns.findIndex((c: any) => c.key === "status_avaliacao") + 1
    const notaColIndex = sheet.columns.findIndex((c: any) => c.key === "nota") + 1

    for (let r = firstDataRow; r <= sheet.rowCount; r++) {
      // Colorir conceito
      if (conceitoColIndex > 0) {
        const cell = sheet.getRow(r).getCell(conceitoColIndex)
        const conceito = String(cell.value ?? "").toUpperCase()

        if (["A", "EXCELENTE", "ÓTIMO"].includes(conceito)) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.success } }
        } else if (["B", "BOM"].includes(conceito)) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.info } }
        } else if (["C", "REGULAR"].includes(conceito)) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.warning } }
        } else if (["D", "F", "INSUFICIENTE", "REPROVADO"].includes(conceito)) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.danger } }
        }
      }

      // Colorir status de avaliação
      if (statusColIndex > 0) {
        const cell = sheet.getRow(r).getCell(statusColIndex)
        const status = String(cell.value ?? "").toLowerCase()

        if (status.includes("aprovado") || status.includes("concluído")) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1FAE5" }, // Verde claro
          } as any
          cell.font = { bold: true, color: { argb: THEME_COLORS.success } }
        } else if (status.includes("pendente") || status.includes("em andamento")) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Amarelo claro
          } as any
          cell.font = { bold: true, color: { argb: THEME_COLORS.warning } }
        } else if (status.includes("reprovado") || status.includes("falta")) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFECACA" }, // Vermelho claro
          } as any
          cell.font = { bold: true, color: { argb: THEME_COLORS.danger } }
        }
      }

      // Colorir notas
      if (notaColIndex > 0) {
        const cell = sheet.getRow(r).getCell(notaColIndex)
        const nota = Number(cell.value ?? 0)

        if (nota >= 9) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.success } }
        } else if (nota >= 7) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.info } }
        } else if (nota >= 5) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.warning } }
        } else if (nota > 0) {
          cell.font = { bold: true, color: { argb: THEME_COLORS.danger } }
        }
      }
    }

    const emailColIndex = sheet.columns.findIndex((c: any) => c.key === "email") + 1
    if (emailColIndex > 0) {
      for (let r = firstDataRow; r <= sheet.rowCount; r++) {
        const cell = sheet.getRow(r).getCell(emailColIndex)
        const email = String(cell.value ?? "")
        if (email.includes("@")) {
          cell.value = { text: email, hyperlink: `mailto:${email}` } as any
          cell.font = { color: { argb: THEME_COLORS.primary }, underline: true }
        }
      }
    }

    sheet.headerFooter.oddHeader = `&C&K1E293B&"Calibri,Bold"&16 Relatório da Turma ${turmaId}`
    sheet.headerFooter.oddFooter =
      '&L&K64748B&"Calibri"&10Gerado em &D às &T &C&K64748BPágina &P de &N &R&K64748BSistema de Relatórios'

    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.6, right: 0.6, top: 0.8, bottom: 0.8, header: 0.3, footer: 0.3 },
      printTitlesRow: "3:3", // Repete o cabeçalho em todas as páginas
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

    LOGGER.info(`Relatório XLSX da turma ${turmaId} salvo com sucesso em ${fileKey}`)
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório XLSX", err)
    throw err
  } finally {
    client.release()
  }
}
