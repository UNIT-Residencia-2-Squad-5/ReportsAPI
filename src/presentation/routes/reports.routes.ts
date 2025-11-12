import { Router } from "express";
import { ReportsController } from "@/presentation/controllers/ReportsController";

export default (router: Router) => {
  router.post('/reports', ReportsController.create);
  router.get('/reports/:id/status', ReportsController.getStatus);
  router.get('/reports/:id/download', ReportsController.download);
  router.get('/reports', ReportsController.getAllReports);

  // TODO: Usar generator com streaming, e gerar XLSX/PDF
  router.get('/workloads/', ReportsController.getWorkload);
}
