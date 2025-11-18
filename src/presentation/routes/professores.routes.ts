import type { Router } from "express"
import { ProfessorController } from "@/presentation/controllers/ProfessorController"

export default (router: Router) => {
  // Rotas de professores

  // TODO: Corrigir tipagem desse método
  //router.get("/professores", ProfessorController.list)
  router.get("/professores/:id", ProfessorController.getById)
}
