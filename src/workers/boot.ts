import "dotenv/config";
import { startReportsWorker } from "./reports.worker";
import { getLogger } from "@/utils/Logger";

const LOGGER = getLogger();

startReportsWorker();

LOGGER.info("Worker iniciado");
