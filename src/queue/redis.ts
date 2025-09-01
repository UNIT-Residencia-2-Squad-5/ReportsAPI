import Redis from "ioredis";
import { getLogger } from "@/utils/Logger";

let redis: Redis;
const LOGGER = getLogger();

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      db: Number(process.env.REDIS_DB),
      maxRetriesPerRequest: null,
    });

    redis.on("connect", () => LOGGER.info("Redis conectado"));
    redis.on("error", err => LOGGER.error("Redis error:", err.message));
  }

  return redis;
}