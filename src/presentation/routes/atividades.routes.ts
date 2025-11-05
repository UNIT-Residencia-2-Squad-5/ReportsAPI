import type { Router } from "express"
import { AtividadeController } from "@/presentation/controllers/AtividadeController"

export default (router: Router) => {
  // Rotas de atividades
  // Suporta filtro opcional por turma via query param: ?turmaId=uuid
  router.get("/atividades", AtividadeController.list)
  router.get("/atividades/:id", AtividadeController.getById)
}
