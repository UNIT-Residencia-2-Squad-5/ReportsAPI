import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import PDFDocument from "pdfkit"
import { PassThrough } from "stream"

const LOGGER = getLogger()

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
      margins: { left: 36, right: 36, top: 36, bottom: 36 },
    })

    const stream = new PassThrough()
    const upload = s3.uploadStreamMultipart(fileKey, stream, "application/pdf")
    doc.pipe(stream)

    // Título
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#1E293B")
      .text(`Relatório — Turma ${turmaId}`, { align: "center" })
    doc.moveDown(0.4)
    doc.font("Helvetica").fontSize(9).fillColor("#64748B")
      .text(new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" }), { align: "center" })
    doc.moveDown(0.8)
    doc.fillColor("#000000")

    const headers = ["Aluno", "Email", "Atividade", "Tipo", "Presença", "Horas", "Nota", "Conceito", "Status"] as const
    const weights = [1.6, 1.8, 1.6, 0.7, 0.7, 0.7, 0.7, 0.8, 1.4]
    const weightSum = weights.reduce((a, b) => a + b, 0)
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const colWidths = weights.map(w => (w / weightSum) * usableWidth)

    const startX = doc.page.margins.left
    let y = doc.y
    const rowH = 20
    const headH = 22

    function drawHeader() {
      doc.rect(startX, y, usableWidth, headH).fill("#1E293B")
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9)
      let x = startX
      headers.forEach((h, i) => {
        doc.text(h, x + 4, y + 6, { width: colWidths[i] - 8 })
        x += colWidths[i]
      })
      doc.fillColor("#000000").font("Helvetica").fontSize(9)
      y += headH
    }
    function newPage() {
      doc.addPage()
      y = doc.y
      drawHeader()
    }

    drawHeader()

    rows.forEach((r, idx) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom) newPage()

      const bg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"
      doc.save().rect(startX, y, usableWidth, rowH).fill(bg).restore()

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
        let color = "#000000"
        let font = "Helvetica"

        // cor condicional para Status (última coluna)
        if (i === headers.length - 1) {
          const s = String(val || "").toLowerCase()
          if (s.includes("reprov")) {
            color = "#EF4444" // vermelho
            font = "Helvetica-Bold"
          } else if (s.includes("aprov") || s.includes("conclu")) {
            color = "#10B981" // verde
            font = "Helvetica-Bold"
          }
        }

        doc.fillColor(color).font(font).text(String(val), x + 4, y + 4, {
          width: colWidths[i] - 8,
        })
        doc.fillColor("#000000").font("Helvetica")
        x += colWidths[i]
      })

      y += rowH
    })

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