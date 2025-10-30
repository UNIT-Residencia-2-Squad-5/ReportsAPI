import type { User } from "@/domain/entities/User"

// User Repository Types
export interface CreateUserData {
  id: string
  name: string
  email: string
  password_hash: string
}

export interface UpdateUserPatch {
  name?: string
  email?: string
  password_hash?: string
}

export interface ListUsersOptions {
  limit: number
  offset: number
}

export interface ListUsersResult {
  data: User[]
  total: number
}

// User Service Types
export interface CreateUserInput {
  name: string
  email: string
  password: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
}

export interface ListUsersParams {
  page?: number
  pageSize?: number
}
