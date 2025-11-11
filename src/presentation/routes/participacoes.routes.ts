import type { Router } from "express"
import { ParticipacaoController } from "@/presentation/controllers/ParticipacaoController"

export default (router: Router) => {
  // Rotas de participações
  // Suporta filtros opcionais via query params: ?turmaId=uuid&alunoId=uuid&atividadeId=uuid
  router.get("/participacoes", ParticipacaoController.list)
  router.get("/participacoes/:id", ParticipacaoController.getById)
}
