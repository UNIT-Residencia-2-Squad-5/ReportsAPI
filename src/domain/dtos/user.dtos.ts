export type CreateUserDTO = {
  name: string;
  email: string;
  password: string;
}

export type UpdateUserDTO = {
  name?: string;
  email?: string;
  password?: string; 
};

export type UserResponseDTO = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export function toUserResponse(u: {
  id: string; name: string; email: string; created_at: Date; updated_at: Date;
}): UserResponseDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    created_at: u.created_at.toISOString(),
    updated_at: u.updated_at.toISOString(),
  };
}