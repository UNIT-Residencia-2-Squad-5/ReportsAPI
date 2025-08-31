export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password_hash: string,
    public created_at: Date,
    public updated_at: Date
  ) {}
}