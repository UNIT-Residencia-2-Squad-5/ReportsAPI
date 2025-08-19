import { Router } from 'express';
import { Postgres } from '@/infrastructure/postgres/Postgres';

export default (router: Router) => {
  router.get('/health', async (_req, res) => {
    try {
      await Postgres.ping();
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded' });
    }
  });
};
