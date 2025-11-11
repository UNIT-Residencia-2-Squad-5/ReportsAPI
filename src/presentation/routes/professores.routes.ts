import type { Router } from "express"
import { ProfessorController } from "@/presentation/controllers/ProfessorController"

export default (router: Router) => {
  // Rotas de professores
  router.get("/professores", ProfessorController.list)
  router.get("/professores/:id", ProfessorController.getById)
}
