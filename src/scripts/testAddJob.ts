import "dotenv/config";
import { reportsQueue } from "@/queue/reports.queue";
import { getLogger } from "@/utils/Logger";

(async () => {
  const LOGGER = getLogger();

  for (let i = 1; i <= 10; i++) {
    const job = await reportsQueue.add("generate-report", {
      turmaId: `turma-${i}`,
      formato: "csv",
    });

    LOGGER.info(`Job adicionado com ID: ${job.id}`);
  }
  
  await reportsQueue.close(); 
  process.exit(0);
})();
