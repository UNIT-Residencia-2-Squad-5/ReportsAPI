import type { User } from "@/domain/entities/User"
import type { CreateUserData, UpdateUserPatch, ListUsersOptions, ListUsersResult } from "@/types/user.types"

/**
 *  Interface para User Repository
 *  Define o contrato para operações de acesso a dados relacionadas a usuários.
 */
export interface IUserRepository {
  /**
   *    Cria um novo usuário no banco de dados
   * @param data -  Dados para criação do usuário
   * @returns   Promise que resolve para a entidade do usuário criado
   */
  create(data: CreateUserData): Promise<User>

  /**
   *    Encontra um usuário pelo seu ID
   * @param id -    Identificador único do usuário
   * @returns   Promise que resolve para a entidade do usuário ou null se não encontrado
   */
  findById(id: string): Promise<User | null>

  /**
   *    Encontra um usuário pelo seu email
   * @param email -     Email do usuário
   * @returns   Promise que resolve para a entidade do usuário ou null se não encontrado
   */
  findByEmail(email: string): Promise<User | null>

  /**
   *    Lista usuários com paginação
   * @param opts -  Opções de paginação (limite e offset)
   * @returns   Promise que resolve para o resultado da listagem de usuários
   */
  list(opts: ListUsersOptions): Promise<ListUsersResult>

  /**
   *    Atualiza um usuário existente com dados parciais
   * @param id -    Identificador único do usuário
   * @param patch -     Dados parciais para atualização do usuário
   * @returns   Promise que resolve para a entidade do usuário atualizado ou null se não encontrado
   */
  update(id: string, patch: UpdateUserPatch): Promise<User | null>

  /**
   *    Deleta um usuário pelo seu ID
   * @param id -    Identificador único do usuário
   * @returns   Promise que resolve para true se o usuário foi deletado, false caso contrário
   */
  delete(id: string): Promise<boolean>
}