import { UserRole } from "../users/user.types";

export interface RegisterInput {
  phone: string;
  password: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
}