import { Worker, Job } from "bullmq";
import { getRedis } from "@/queue/redis";
import { getLogger } from "@/utils/Logger";
import { ReportsRepository } from "@/infrastructure/repositories/ReportsRepository";
import { generateReportXLSX } from "@/infrastructure/reports/reports-xlsx.generator";
import { generateReportPDF } from "@/infrastructure/reports/reports-pdf.generator";
import { generateReportWorkloadXLSX } from "@/infrastructure/reports/workloadReports-xlsx.generator";
import { Postgres } from "@/infrastructure/postgres/Postgres";

Postgres.init();
const LOGGER = getLogger();
const repo = new ReportsRepository(Postgres.getPool());

const REPORT_GENERATORS = {
  excel: {
    ext: "xlsx",
    generate: generateReportXLSX,
  },
  pdf: {
    ext: "pdf",
    generate: generateReportPDF,
  },
  workload_excel: {
    ext: "xlsx",
    generate: generateReportWorkloadXLSX,
  }
} as const;

async function processReportJob(job: Job<{ turmaId: string; solicitacaoId: string; tipoRelatorio: keyof typeof REPORT_GENERATORS }> ){
  const { turmaId, solicitacaoId, tipoRelatorio } = job.data;
  const generator = REPORT_GENERATORS[tipoRelatorio];

  LOGGER.info("==========================================");
  LOGGER.info(`[JOB ${job.id}] Iniciando geração de relatório`);
  LOGGER.info(`→ Turma ID: ${turmaId}`);
  LOGGER.info(`→ Solicitação ID: ${solicitacaoId}`);
  LOGGER.info(`→ Tipo: ${tipoRelatorio.toUpperCase()}`);

  try {
    await repo.updateStatus(solicitacaoId, "processando");

    const fileKey = `relatorios/${solicitacaoId}.${generator.ext}`;
    const nomeArquivo = `relatorio_turma_${turmaId}.${generator.ext}`;

    await generator.generate(turmaId, fileKey);

    await repo.insertMetadados(
      solicitacaoId,
      turmaId,
      generator.ext,
      nomeArquivo,
      fileKey
    );

    await repo.updateStatus(solicitacaoId, "concluido");

    LOGGER.info(`[JOB ${job.id}] ✅ Relatório gerado com sucesso.`);
  } catch (error: any) {
    LOGGER.error(`[JOB ${job.id}] ❌ Erro: ${error.message}`);
    await repo.updateStatus(solicitacaoId, "erro");
    throw error;
  }
}

export function startReportsWorker() {
  const worker = new Worker(
    "reports_queue",
    processReportJob,
    {
      connection: getRedis(),
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    LOGGER.info(`[JOB ${job.id}] Finalizado com sucesso.`);
  });

  worker.on("failed", (job, err) => {
    LOGGER.error(`[JOB ${job?.id}] Falhou: ${err.message}`);
  });

  worker.on("error", (err) => {
    LOGGER.error(`[WORKER] Erro inesperado: ${err.message}`);
  });

  LOGGER.info("Worker de relatórios iniciado (fila: reports_queue)");
  return worker;
}
