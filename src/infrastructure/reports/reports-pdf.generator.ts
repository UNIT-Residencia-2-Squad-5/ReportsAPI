import { Postgres } from "@/infrastructure/postgres/Postgres";
import { S3Storage } from "@/infrastructure/object-storage/S3Storage";
import { getLogger } from "@/utils/Logger";
import { PassThrough } from "stream";
import QueryStream from "pg-query-stream";
import PDFDocument from "pdfkit";

const LOGGER = getLogger();

export async function generateReportPDF(turmaId: string, fileKey: string) {
  const client = await Postgres.getPool().connect();
  const s3 = new S3Storage();
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  try {
    // Stream para upload no S3
    const passthrough = new PassThrough();
    const uploadPromise = s3.uploadStreamMultipart(
      fileKey,
      passthrough,
      "application/pdf"
    );

    doc.pipe(passthrough);

    // Cabeçalho
    doc.fontSize(18).text("Relatório da Turma", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Turma ID: ${turmaId}`, { align: "left" });
    doc.moveDown(1.5);

    // Cabeçalho da tabela
    const tableTop = doc.y;
    drawTableHeader(doc, tableTop);

    // Consulta via stream
    const sql = `
      SELECT a.nome AS aluno, at.nome AS atividade, p.nota, p.conceito
      FROM participacoes p
      JOIN alunos a ON a.id = p.aluno_id
      JOIN atividades at ON at.id = p.atividade_id
      WHERE p.turma_id = $1
      ORDER BY a.nome;
    `;
    const queryStream = new QueryStream(sql, [turmaId]);
    const pgStream = client.query(queryStream);

    let y = tableTop + 25;

    // Consome linha a linha
    for await (const row of pgStream) {
      if (y > 750) {
        doc.addPage();
        drawTableHeader(doc, 50);
        y = 75;
      }
      drawTableRow(doc, y, row);
      y += 20;
    }

    // Rodapé
    doc.moveDown(2);
    doc.fontSize(10).text(`Gerado em ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
    await uploadPromise;

    LOGGER.info(`Relatório PDF da turma ${turmaId} salvo com sucesso`);
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório PDF", err);
    throw err;
  } finally {
    client.release();
  }
}

// --- Funções auxiliares ---

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Aluno", 50, y, { width: 200, continued: true });
  doc.text("Atividade", 250, y, { width: 150, continued: true });
  doc.text("Nota", 400, y, { width: 50, continued: true });
  doc.text("Conceito", 450, y);
  doc.font("Helvetica");
  doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
}

function drawTableRow(doc: PDFKit.PDFDocument, y: number, row: any) {
  doc.fontSize(10);
  doc.text(row.aluno, 50, y, { width: 200, continued: true });
  doc.text(row.atividade, 250, y, { width: 150, continued: true });
  doc.text(row.nota?.toString() ?? "-", 400, y, { width: 50, continued: true });
  doc.text(row.conceito ?? "-", 450, y);
}
