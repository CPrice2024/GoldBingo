import { UserRole } from "../users/user.types";

export interface RegisterInput {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
  referralCode?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
}