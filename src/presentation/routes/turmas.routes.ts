import type { Router } from "express"
import { TurmaController } from "@/presentation/controllers/TurmaController"

export default (router: Router) => {
  // Rotas de turmas
  router.get("/turmas", TurmaController.list)
  router.get("/turmas/:id", TurmaController.getById)

  // Rotas auxiliares para buscar recursos relacionados a uma turma
  router.get("/turmas/:id/professores", TurmaController.getProfessores)
  router.get("/turmas/:id/alunos", TurmaController.getAlunos)
  router.get("/turmas/:id/atividades", TurmaController.getAtividades)
}
