import type { Router } from "express"
import { AlunoController } from "@/presentation/controllers/AlunoController"

export default (router: Router) => {
  // Rotas de alunos
  router.get("/alunos", AlunoController.list)
  router.get("/alunos/:id", AlunoController.getById)
}
