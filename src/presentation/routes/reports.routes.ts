import type { Router } from "express"
import { ReportsController } from "../controllers/ReportsController"
import { validateReportCreation } from "../middlewares/validation.middleware"

export default (router: Router) => {
  router.post("/reports", validateReportCreation, ReportsController.create)
  router.get("/reports/:id/status", ReportsController.getStatus)
  router.get("/reports/:id/download", ReportsController.download)
  router.get("/reports", ReportsController.getAllReports)
}
