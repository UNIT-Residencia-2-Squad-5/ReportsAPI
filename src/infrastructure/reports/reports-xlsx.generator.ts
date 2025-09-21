import { Postgres } from "@/infrastructure/postgres/Postgres";
import { S3Storage } from "@/infrastructure/object-storage/S3Storage";
import { getLogger } from "@/utils/Logger";
import ExcelJS from "exceljs";
import { PassThrough } from "stream";

const LOGGER = getLogger();

export async function generateReportXLSX(turmaId: string, fileKey: string) {
  const client = await Postgres.getPool().connect();
  const s3 = new S3Storage();
  
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
    `;

    const result = await client.query(sql, [turmaId]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório");

    sheet.columns = [
      { header: "Aluno", key: "aluno", width: 25 },
      { header: "Atividade", key: "atividade", width: 25 },
      { header: "Nota", key: "nota", width: 10 },
      { header: "Conceito", key: "conceito", width: 10 },
      { header: "Presença", key: "presenca", width: 10 },
      { header: "Horas", key: "horas", width: 10 },
      { header: "Status Avaliação", key: "status_avaliacao", width: 20 },
    ];

    result.rows.forEach((row) => sheet.addRow(row));

    const passthroughStream = new PassThrough();

    const uploadPromise = s3.uploadStreamMultipart(
      fileKey,
      passthroughStream,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(passthroughStream);
    passthroughStream.end();

    await uploadPromise;

    LOGGER.info(`Relatório XLSX da turma ${turmaId} salvo com sucesso`);
  } catch (err) {
    LOGGER.error("Erro ao gerar relatório XLSX", err);
    throw err;
  } finally {
    client.release();
  }
}