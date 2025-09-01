import { Worker, Job } from "bullmq";
import { getRedis } from "@/queue/redis";
import { getLogger } from "@/utils/Logger";

const LOGGER = getLogger();

export function startReportsWorker() {
  const worker = new Worker(
    "reports_queue",
    async (job: Job) => {
      LOGGER.info("==========================================");
      LOGGER.info("Job recebido, processando...");
      LOGGER.info("ID:", job.id);
      LOGGER.info("Nome:", job.name);
      LOGGER.info("Dados:", job.data);
      
      // Simula um trabalho pesado de 5 segundos
      await new Promise((resolve) => setTimeout(resolve, 5000));
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
