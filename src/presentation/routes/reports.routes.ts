import { Router } from "express";
import { ReportsController } from "@/presentation/controllers/ReportsController";

export default (router: Router) => {
  router.post('/reports', ReportsController.create);
  router.get('/reports/:id/status', ReportsController.getStatus);
  router.get('/reports/:id/download', ReportsController.download);

  // TODO: Criar rotas para -> (Retornar todos os relatorios_gerados, Retornar todas as solicitacoes_relatorio)
}
