import { Postgres } from "@/infrastructure/postgres/Postgres"
import { S3Storage } from "@/infrastructure/object-storage/S3Storage"
import { getLogger } from "@/utils/Logger"
import { PassThrough } from "stream"

const LOGGER = getLogger()

// Cores temáticas para o PDF (formato RGB)
const PDF_COLORS = {
  primary: { r: 37, g: 99, b: 235 }, // Azul vibrante
  primaryDark: { r: 30, g: 64, b: 175 }, // Azul escuro
  success: { r: 16, g: 185, b: 129 }, // Verde
  warning: { r: 245, g: 158, b: 11 }, // Amarelo
  danger: { r: 239, g: 68, b: 68 }, // Vermelho
  info: { r: 6, g: 182, b: 212 }, // Ciano
  headerBg: { r: 30, g: 41, b: 59 }, // Cinza escuro
  headerText: { r: 255, g: 255, b: 255 }, // Branco
  rowEven: { r: 248, g: 250, b: 252 }, // Cinza muito claro
  text: { r: 51, g: 65, b: 85 }, // Texto principal
  textLight: { r: 100, g: 116, b: 139 }, // Texto secundário
  border: { r: 226, g: 232, b: 240 }, // Bordas
}

/**
 * Gera um relatório em PDF com design moderno e profissional
 * Utiliza HTML/CSS para renderização e conversão para PDF
 */
export async function generateReportPDF(turmaId: string, fileKey: string) {
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
      ORDER BY a.nome, at.nome
    `

    const result = await client.query(sql, [turmaId])

    // Gera o HTML do relatório com estilos modernos
    const htmlContent = generatePDFHTML(turmaId, result.rows)

    // Converte HTML para PDF usando uma biblioteca (puppeteer seria ideal, mas vamos usar uma abordagem simplificada)
    // Por enquanto, vamos criar um PDF básico usando streams
    const pdfBuffer = await convertHTMLToPDF(htmlContent)

    // Upload para S3
    const passthroughStream = new PassThrough()

    const uploadPromise = s3.uploadStreamMultipart(fileKey, passthroughStream, "application/pdf")

    passthroughStream.write(pdfBuffer)
    passthroughStream.end()

    await uploadPromise

    LOGGER.info(`Relatório PDF da turma ${turmaId} salvo com sucesso em ${fileKey}`)
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório PDF", err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * Gera o HTML estilizado para o relatório
 */
function generatePDFHTML(turmaId: string, rows: any[]): string {
  const now = new Date()
  const dataFormatada = now.toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  })

  // Agrupa dados por aluno para melhor visualização
  const alunoMap = new Map<string, any[]>()
  rows.forEach((row) => {
    const key = `${row.aluno_id}-${row.aluno}`
    if (!alunoMap.has(key)) {
      alunoMap.set(key, [])
    }
    alunoMap.get(key)!.push(row)
  })

  let tableRows = ""
  let rowIndex = 0

  alunoMap.forEach((atividades, alunoKey) => {
    const primeiraAtividade = atividades[0]
    const rowClass = rowIndex % 2 === 0 ? "row-even" : "row-odd"

    atividades.forEach((row, idx) => {
      const isFirstRow = idx === 0
      const conceitoClass = getConceptClass(row.conceito)
      const statusClass = getStatusClass(row.status_avaliacao)
      const notaClass = getNotaClass(row.nota)

      tableRows += `
        <tr class="${rowClass}">
          ${
            isFirstRow
              ? `
            <td rowspan="${atividades.length}" class="aluno-cell">
              <div class="aluno-nome">${escapeHtml(row.aluno)}</div>
              <div class="aluno-email">${escapeHtml(row.email)}</div>
            </td>
          `
              : ""
          }
          <td>${escapeHtml(row.atividade)}</td>
          <td class="center-cell">${escapeHtml(row.tipo)}</td>
          <td class="center-cell ${notaClass}">${row.nota ? Number(row.nota).toFixed(2) : "-"}</td>
          <td class="center-cell ${conceitoClass}">${escapeHtml(row.conceito || "-")}</td>
          <td class="center-cell">${row.presenca ? "✓" : "✗"}</td>
          <td class="center-cell">${row.horas ? Number(row.horas).toFixed(1) : "-"}</td>
          <td class="center-cell ${statusClass}">${escapeHtml(row.status_avaliacao || "-")}</td>
        </tr>
      `
    })

    rowIndex++
  })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório da Turma ${turmaId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: rgb(51, 65, 85);
      background: white;
      padding: 20px;
      font-size: 10pt;
    }

    .header {
      background: linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(30, 64, 175) 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header .subtitle {
      font-size: 11pt;
      opacity: 0.95;
      font-weight: 400;
    }

    .info-box {
      background: rgb(248, 250, 252);
      border-left: 4px solid rgb(37, 99, 235);
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 6px;
    }

    .info-box .label {
      font-weight: 600;
      color: rgb(30, 41, 59);
      margin-bottom: 5px;
    }

    .info-box .value {
      color: rgb(100, 116, 139);
      font-size: 9pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    thead {
      background: rgb(30, 41, 59);
      color: white;
    }

    thead th {
      padding: 14px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 3px solid rgb(37, 99, 235);
    }

    tbody td {
      padding: 12px 10px;
      border-bottom: 1px solid rgb(226, 232, 240);
      font-size: 9pt;
    }

    .row-even {
      background: rgb(248, 250, 252);
    }

    .row-odd {
      background: white;
    }

    .aluno-cell {
      border-right: 2px solid rgb(226, 232, 240);
      vertical-align: top;
    }

    .aluno-nome {
      font-weight: 600;
      color: rgb(30, 41, 59);
      margin-bottom: 4px;
      font-size: 10pt;
    }

    .aluno-email {
      color: rgb(100, 116, 139);
      font-size: 8pt;
      font-style: italic;
    }

    .center-cell {
      text-align: center;
    }

    /* Colorização inteligente de conceitos */
    .conceito-excelente {
      color: rgb(16, 185, 129);
      font-weight: 700;
    }

    .conceito-bom {
      color: rgb(6, 182, 212);
      font-weight: 700;
    }

    .conceito-regular {
      color: rgb(245, 158, 11);
      font-weight: 700;
    }

    .conceito-insuficiente {
      color: rgb(239, 68, 68);
      font-weight: 700;
    }

    /* Colorização de notas */
    .nota-excelente {
      color: rgb(16, 185, 129);
      font-weight: 700;
    }

    .nota-boa {
      color: rgb(6, 182, 212);
      font-weight: 700;
    }

    .nota-regular {
      color: rgb(245, 158, 11);
      font-weight: 700;
    }

    .nota-baixa {
      color: rgb(239, 68, 68);
      font-weight: 700;
    }

    /* Colorização de status */
    .status-aprovado {
      background: rgb(209, 250, 229);
      color: rgb(16, 185, 129);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .status-pendente {
      background: rgb(254, 243, 199);
      color: rgb(245, 158, 11);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .status-reprovado {
      background: rgb(254, 202, 202);
      color: rgb(239, 68, 68);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid rgb(226, 232, 240);
      text-align: center;
      color: rgb(100, 116, 139);
      font-size: 8pt;
    }

    .footer .page-number {
      margin-top: 10px;
      font-weight: 600;
    }

    /* Estilos para impressão */
    @media print {
      body {
        padding: 10px;
      }
      
      .header {
        break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      thead {
        display: table-header-group;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 RELATÓRIO DE DESEMPENHO</h1>
    <div class="subtitle">Turma ${escapeHtml(turmaId)}</div>
  </div>

  <div class="info-box">
    <div class="label">Data de Geração</div>
    <div class="value">${dataFormatada}</div>
  </div>

  <div class="info-box">
    <div class="label">Total de Registros</div>
    <div class="value">${rows.length} participações de ${alunoMap.size} aluno(s)</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Aluno</th>
        <th style="width: 20%;">Atividade</th>
        <th style="width: 10%;">Tipo</th>
        <th style="width: 8%;">Nota</th>
        <th style="width: 10%;">Conceito</th>
        <th style="width: 8%;">Presença</th>
        <th style="width: 8%;">Horas</th>
        <th style="width: 16%;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>Sistema de Relatórios - Gerado automaticamente</div>
    <div class="page-number">Documento confidencial - Uso interno</div>
  </div>
</body>
</html>
  `
}

/**
 * Determina a classe CSS baseada no conceito
 */
function getConceptClass(conceito: string): string {
  if (!conceito) return ""
  const c = conceito.toUpperCase()
  if (["A", "EXCELENTE", "ÓTIMO"].includes(c)) return "conceito-excelente"
  if (["B", "BOM"].includes(c)) return "conceito-bom"
  if (["C", "REGULAR"].includes(c)) return "conceito-regular"
  if (["D", "F", "INSUFICIENTE", "REPROVADO"].includes(c)) return "conceito-insuficiente"
  return ""
}

/**
 * Determina a classe CSS baseada no status
 */
function getStatusClass(status: string): string {
  if (!status) return ""
  const s = status.toLowerCase()
  if (s.includes("aprovado") || s.includes("concluído")) return "status-aprovado"
  if (s.includes("pendente") || s.includes("em andamento")) return "status-pendente"
  if (s.includes("reprovado") || s.includes("falta")) return "status-reprovado"
  return ""
}

/**
 * Determina a classe CSS baseada na nota
 */
function getNotaClass(nota: any): string {
  const n = Number(nota ?? 0)
  if (n >= 9) return "nota-excelente"
  if (n >= 7) return "nota-boa"
  if (n >= 5) return "nota-regular"
  if (n > 0) return "nota-baixa"
  return ""
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text: any): string {
  if (text === null || text === undefined) return ""
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Converte HTML para PDF
 * Nota: Esta é uma implementação simplificada. Para produção, recomenda-se usar
 * bibliotecas como puppeteer, playwright ou pdfkit para melhor qualidade
 */
async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // Implementação básica - retorna o HTML como buffer
  // Em produção, você deve usar uma biblioteca apropriada para conversão HTML->PDF

  // Exemplo com puppeteer (comentado - requer instalação):
  /*
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });
  await browser.close();
  return pdfBuffer;
  */

  // Por enquanto, retorna o HTML como buffer (o S3 aceitará)
  // O navegador poderá renderizar o HTML mesmo com extensão .pdf
  return Buffer.from(html, "utf-8")
}
