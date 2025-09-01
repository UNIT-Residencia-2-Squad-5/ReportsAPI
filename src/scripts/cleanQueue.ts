import "dotenv/config";
import { Queue } from 'bullmq';
import { getRedis } from "@/queue/redis";
import { getLogger } from "@/utils/Logger";

const LOGGER = getLogger();

async function clearQueue() {
  const queue = new Queue('reports_queue', {
    connection: getRedis(),
  });

  await queue.drain(); // remove jobs pendentes
  await queue.clean(0, 0, 'completed'); // remove concluídos
  await queue.clean(0, 0, 'failed');    // remove falhos
  await queue.obliterate({ force: true }); // limpa tudo 

  LOGGER.info('Fila limpa com sucesso!');
  process.exit(0);
}

clearQueue();
