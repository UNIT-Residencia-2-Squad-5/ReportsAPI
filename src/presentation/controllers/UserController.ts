import { Request, Response } from "express";
import { Postgres } from "@/infrastructure/postgres/Postgres";
import { UserService } from "@/domain/services/UserService";
import { ValidationError, ConflictError, NotFoundError } from "@/domain/errors/DomainErrors";
import { toUserResponse } from "@/domain/dtos/user.dtos";

export class UserController {
  static async create(req: Request, res: Response) {
    const service = new UserService(Postgres.getPool());
    try {
      const user = await service.create(req.body);
      return res.status(201).json(toUserResponse(user));
    } catch (e: any) {
      if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
      if (e instanceof ConflictError)   return res.status(409).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }

  static async getById(req: Request, res: Response) {
    const service = new UserService(Postgres.getPool());
    try {
      const user = await service.getById(req.params.id);
      return res.json(toUserResponse(user));
    } catch (e: any) {
      if (e instanceof NotFoundError) return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }

  static async list(req: Request, res: Response) {
    const service = new UserService(Postgres.getPool());
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    try {
      const { data, total } = await service.list(page, pageSize);
      return res.json({
        total,
        page,
        pageSize,
        data: data.map(toUserResponse),
      });
    } catch {
      return res.status(500).json({ error: "Internal error" });
    }
  }

  static async update(req: Request, res: Response) {
    const service = new UserService(Postgres.getPool());
    try {
      const user = await service.update(req.params.id, req.body);
      return res.json(toUserResponse(user));
    } catch (e: any) {
      if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
      if (e instanceof ConflictError)   return res.status(409).json({ error: e.message });
      if (e instanceof NotFoundError)   return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }

  static async delete(req: Request, res: Response) {
    const service = new UserService(Postgres.getPool());
    try {
      await service.delete(req.params.id);
      return res.status(204).send();
    } catch (e: any) {
      if (e instanceof NotFoundError) return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }
}
