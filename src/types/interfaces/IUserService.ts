import type { User } from "@/domain/entities/User"
import type { CreateUserInput, UpdateUserInput, ListUsersResult } from "@/types/user.types"

/**
 *  Interface para User Service
 *  Define o contrato para operações de serviço relacionadas a usuários.
 */
export interface IUserService {
  /**
   *    Cria um novo usuário com validação
   * @param data -  Dados para criação do usuário
   * @returns   Promise que resolve para a entidade do usuário criado
   * @throws    ValidationError if data is invalid
   * @throws    ConflictError se email ja existir no sistema
   */
  create(data: CreateUserInput): Promise<User>

  /**
   *    Recupera um usuário pelo seu ID
   * @param id -    Identificador único do usuário
   * @returns   Promise que resolve para a entidade do usuário
   * @throws    NotFoundError se o usuário não for encontrado
   */
  getById(id: string): Promise<User>

  /**
   *    Lista usuários com paginação
   * @param page -  Número da página (default: 1)
   * @param pageSize -     Número de usuários por página ( gpt disse q era pra colcoar mas lembrar de aumentar o limite máximo dps ;-;)
   * @returns   Promise que resolve para o resultado da listagem de usuários
   */
  list(page?: number, pageSize?: number): Promise<ListUsersResult>

  /**
   *    Atualiza um usuário existente com validação
   * @param id -    Identificador único do usuário
   * @param data -  Dados para atualização do usuário
   * @returns   Promise que resolve para a entidade do usuário atualizado
   * @throws    ValidationError se dado for invalido
   * @throws    NotFoundError se o usuário não for encontrado
   * @throws    ConflictError se email ja existir no sistema
   */
  update(id: string, data: UpdateUserInput): Promise<User>

  /**
   *    Deleta um usuário pelo seu ID
   * @param id -    Identificador único do usuário
   * @returns   Promise que resolve para true se o usuário foi deletado, false caso contrário
   * @throws    NotFoundError se o usuário não for encontrado
   */
  delete(id: string): Promise<boolean>
}
