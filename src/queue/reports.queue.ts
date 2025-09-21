import { Queue } from "bullmq";
import { getRedis } from "@/queue/redis";
import { getLogger } from "@/utils/Logger";

const LOGGER = getLogger();

export const reportsQueue = new Queue("reports_queue", {
  connection: getRedis(),
});

interface EnqueueReportJobProps {
  turmaId: string;
  solicitacaoId: string;
}

export async function enqueueReportJob({ turmaId, solicitacaoId }: EnqueueReportJobProps) {
  LOGGER.info(`Enfileirando job para turma ${turmaId}, solicitação ${solicitacaoId}`);

  await reportsQueue.add("generate_report", { turmaId, solicitacaoId }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  LOGGER.info("Job enfileirado com sucesso");
}