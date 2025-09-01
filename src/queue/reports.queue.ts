import { Queue } from "bullmq";
import { getRedis } from "./redis";

export const reportsQueue = new Queue("reports_queue", {
  connection: getRedis(),
});