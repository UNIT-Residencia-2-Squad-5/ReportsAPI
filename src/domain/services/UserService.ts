import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { CreateUserDTO, UpdateUserDTO } from "@/domain/dtos/user.dtos";
import { hashPassword } from "@/utils/Password";

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}

export class UserService {
  private readonly repo: UserRepository;

  constructor(pool: Pool) {
    this.repo = new UserRepository(pool);
  }

  private validateEmail(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError("Email inválido");
    }
  }
  private validateName(name: string) {
    if (!name || name.trim().length < 2) throw new ValidationError("Nome muito curto");
  }
  private validatePassword(password: string) {
    if (!password || password.length < 6) throw new ValidationError("Senha deve ser maior que 6 caracteres");
  }

  async create(data: CreateUserDTO) {
    this.validateName(data.name);
    this.validateEmail(data.email);
    this.validatePassword(data.password);

    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new ConflictError("Email já existe");

    const id = randomUUID();
    const password_hash = await hashPassword(data.password);
    return await this.repo.create({ id, name: data.name.trim(), email: data.email.toLowerCase(), password_hash });
  }

  async getById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError("Usuário não encontrado");
    return user;
  }

  async list(page = 1, pageSize = 20) {
    const limit = Math.max(1, Math.min(100, pageSize));
    const offset = (Math.max(1, page) - 1) * limit;
    return await this.repo.list({ limit, offset });
  }

  async update(id: string, data: UpdateUserDTO) {
    if (!data || Object.keys(data).length === 0) throw new ValidationError("Corpo da requisição deve ter ao menos um item");

    const patch: { 
      name?: string; 
      email?: string; 
      password_hash?: string 
    } = {};

    if (data.name !== undefined) {
      this.validateName(data.name);
      patch.name = data.name.trim();
    }
    if (data.email !== undefined) {
      this.validateEmail(data.email);
      const current = await this.repo.findById(id);
      if (!current) throw new NotFoundError("Usuário não encontrado");
      if (current.email !== data.email.toLowerCase()) {
        const exists = await this.repo.findByEmail(data.email.toLowerCase());
        if (exists && exists.id !== id) throw new ConflictError("Email já existe");
      }
      patch.email = data.email.toLowerCase();
    }
    if (data.password !== undefined) {
      this.validatePassword(data.password);
      patch.password_hash = await hashPassword(data.password);
    }

    const updated = await this.repo.update(id, patch);
    if (!updated) throw new NotFoundError("Usuário não encontrado");
    return updated;
  }

  async delete(id: string) {
    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError("Usuário não encontrado");
    return ok;
  }
}
