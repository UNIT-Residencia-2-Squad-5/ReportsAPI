import { Router } from "express";
import { ReportsController } from "@/presentation/controllers/ReportsController";

// TODO: Criar rotas auxiliares para o Frontend
export default (router: Router) => {
  router.post('/reports', ReportsController.create);
  router.get('/reports/:id/status', ReportsController.getStatus);
  router.get('/reports/:id/download', ReportsController.download);
}
