import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import PDFDocument from "pdfkit"
import { PassThrough } from "stream"

const LOGGER = getLogger()

const THEME_COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
  headerBg: "#1E293B",
  headerText: "#FFFFFF",
  rowEven: "#F8FAFC",
  rowOdd: "#FFFFFF",
  border: "#E2E8F0",
  text: "#000000",
  textMuted: "#64748B",
}

type Row = {
  aluno_id: number
  aluno: string
  email: string | null
  atividade: string
  tipo: string | null
  presenca: boolean | "t" | "f" | 1 | 0 | "1" | "0" | null
  horas: number | string | null
  nota: number | string | null
  conceito: string | null
  status_avaliacao: string | null
}

function fmtNum(v: any, places = 2) {
  if (v === null || v === undefined || v === "") return "-"
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."))
  if (!Number.isFinite(n)) return String(v)
  return n.toFixed(places)
}
function fmtBool(v: any) {
  if (v === null || v === undefined) return "-"
  const b = v === true || v === "t" || v === 1 || v === "1"
  return b ? "Sim" : "Não"
}
function textOrDash(v: any) {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s.length ? s : "-"
}

function getStatusColor(status: string): string {
  const s = String(status || "").toLowerCase()
  if (s.includes("aprovado") || s.includes("concluído")) return THEME_COLORS.success
  if (s.includes("reprovado") || s.includes("falta")) return THEME_COLORS.danger
  if (s.includes("pendente") || s.includes("andamento")) return THEME_COLORS.warning
  return THEME_COLORS.text
}

function getConceptColor(conceito: string): string {
  const c = String(conceito || "").toUpperCase()
  if (["A", "EXCELENTE", "ÓTIMO"].includes(c)) return THEME_COLORS.success
  if (["B", "BOM"].includes(c)) return THEME_COLORS.info
  if (["C", "REGULAR"].includes(c)) return THEME_COLORS.warning
  if (["D", "F", "INSUFICIENTE", "REPROVADO"].includes(c)) return THEME_COLORS.danger
  return THEME_COLORS.text
}

function getNoteColor(nota: string | number): string {
  const n = Number(nota)
  if (n >= 9) return THEME_COLORS.success
  if (n >= 7) return THEME_COLORS.info
  if (n >= 5) return THEME_COLORS.warning
  if (n > 0) return THEME_COLORS.danger
  return THEME_COLORS.text
}

export async function generateReportPDF(turmaId: string, fileKey: string) {
  const client = await Postgres.getPool().connect()
  const s3 = new S3Storage()

  try {
    const sql = `
      SELECT
        a.id   AS aluno_id,
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
      JOIN alunos a      ON a.id = p.aluno_id
      JOIN atividades at ON at.id = p.atividade_id
      WHERE p.turma_id = $1
      ORDER BY a.nome
    `
    const { rows } = await client.query<Row>(sql, [turmaId])
    if (!rows.length) throw new Error("Nenhum dado encontrado para PDF.")

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { left: 30, right: 30, top: 30, bottom: 30 },
    })

    const stream = new PassThrough()
    const upload = s3.uploadStreamMultipart(fileKey, stream, "application/pdf")
    doc.pipe(stream)

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(THEME_COLORS.headerBg)
      .text(`📊 RELATÓRIO DE DESEMPENHO - TURMA ${turmaId}`, { align: "center" })

    doc.moveDown(0.3)
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(THEME_COLORS.textMuted)
      .text(`Gerado em ${new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}`, {
        align: "center",
      })
    doc.moveDown(0.6)

    const headers = ["Aluno", "Email", "Atividade", "Tipo", "Presença", "Horas", "Nota", "Conceito", "Status"] as const
    const weights = [1.5, 1.6, 1.5, 0.6, 0.6, 0.6, 0.6, 0.7, 1.3]
    const weightSum = weights.reduce((a, b) => a + b, 0)
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const colWidths = weights.map((w) => (w / weightSum) * usableWidth)

    const startX = doc.page.margins.left
    let y = doc.y
    const rowH = 18
    const headH = 20

    function drawHeader() {
      doc.rect(startX, y, usableWidth, headH).fill(THEME_COLORS.headerBg)
      doc.fillColor(THEME_COLORS.headerText).font("Helvetica-Bold").fontSize(8)
      let x = startX
      headers.forEach((h, i) => {
        doc.text(h, x + 3, y + 4, { width: colWidths[i] - 6, align: "center" })
        x += colWidths[i]
      })
      doc.fillColor(THEME_COLORS.text).font("Helvetica").fontSize(8)
      y += headH
    }

    function newPage() {
      doc.addPage()
      y = doc.page.margins.top
      drawHeader()
    }

    drawHeader()

    rows.forEach((r, idx) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom - 10) newPage()

      const bg = idx % 2 === 0 ? THEME_COLORS.rowOdd : THEME_COLORS.rowEven
      doc.save().rect(startX, y, usableWidth, rowH).fill(bg).restore()

      doc.lineWidth(0.5).strokeColor(THEME_COLORS.border)
      doc
        .moveTo(startX, y)
        .lineTo(startX + usableWidth, y)
        .stroke()

      const values = [
        textOrDash(r.aluno),
        textOrDash(r.email),
        textOrDash(r.atividade),
        textOrDash(r.tipo),
        fmtBool(r.presenca),
        fmtNum(r.horas, 2),
        fmtNum(r.nota, 2),
        textOrDash(r.conceito),
        textOrDash(r.status_avaliacao),
      ]

      let x = startX
      values.forEach((val, i) => {
        let color = THEME_COLORS.text
        let font = "Helvetica"

        if (i === 8) {
          // Status (última coluna)
          color = getStatusColor(val)
          font = "Helvetica-Bold"
        } else if (i === 7) {
          // Conceito
          color = getConceptColor(val)
          font = "Helvetica-Bold"
        } else if (i === 6) {
          // Nota
          color = getNoteColor(val)
          if (val !== "-") font = "Helvetica-Bold"
        }

        doc
          .fillColor(color)
          .font(font)
          .fontSize(8)
          .text(String(val), x + 3, y + 3, {
            width: colWidths[i] - 6,
            align: ["aluno", "atividade", "email"].includes(String(i)) ? "left" : "center",
          })
        doc.fillColor(THEME_COLORS.text).font("Helvetica")
        x += colWidths[i]
      })

      y += rowH
    })

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(THEME_COLORS.textMuted)
      .text("Sistema de Relatórios", doc.page.margins.left, doc.page.height - 20, { align: "center" })

    doc.end()
    await upload
    LOGGER.info(`[PDF] Turma ${turmaId} salvo em ${fileKey}`)
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório PDF", err)
    throw err
  } finally {
    client.release()
  }
}
