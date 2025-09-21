import { Worker, Job } from "bullmq";
import { getRedis } from "@/queue/redis";
import { getLogger } from "@/utils/Logger";
import { ReportsRepository } from "@/infrastructure/repositories/ReportsRepository";
import { generateReportXLSX } from "@/infrastructure/reports/reports-xlsx.generator";
import { Postgres } from "@/infrastructure/postgres/Postgres";

Postgres.init();
const LOGGER = getLogger();
const repo = new ReportsRepository(Postgres.getPool()); 

export function startReportsWorker() {
  const worker = new Worker(
    "reports_queue",
    async (job: Job<{ turmaId: string; solicitacaoId: string }>) => {
      const { turmaId, solicitacaoId } = job.data;

      LOGGER.info("==========================================");
      LOGGER.info("Job recebido:", job.id);
      LOGGER.info("Turma ID:", turmaId);
      LOGGER.info("Solicitação ID:", solicitacaoId);
      
      try {
        await repo.updateStatus(solicitacaoId, "processando");

        const fileKey = `relatorios/${solicitacaoId}.xlsx`
        await generateReportXLSX(turmaId, fileKey);

        const nomeArquivo = `relatorio_turma_${turmaId}.xlsx`;
        await repo.insertMetadados(solicitacaoId, turmaId, "excel", nomeArquivo, fileKey);

        await repo.updateStatus(solicitacaoId, "concluido");

        LOGGER.info(`Job ${job.id} finalizado com sucesso.`);
      } catch (error: any) {
        LOGGER.error(`Erro ao processar job ${job.id}:`, error.message);
        await repo.updateStatus(solicitacaoId, "erro");
        throw error; 
      }
    },
    {
      connection: getRedis(),
      concurrency: 3, // Paralelismo, processa 3x jobs simultaneamente
    }
  );

  worker.on("completed", (job) => {
    LOGGER.info("Job concluído:", job.id);
  });

  worker.on("failed", (job, err) => {
    LOGGER.error("Job falhou:", job?.id, err.message);
  });

  return worker;
}
