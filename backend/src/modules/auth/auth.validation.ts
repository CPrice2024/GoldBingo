import { RegisterInput, LoginInput } from "./auth.types";

export const validateRegisterInput = (
  data: RegisterInput
): string | null => {

  if (!data.phone || data.phone.trim().length < 8) {
    return "Valid phone number is required";
  }

  if (!data.password || data.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

export const validateLoginInput = (
  data: LoginInput
): string | null => {
  if (!data.phone) {
    return "Phone number is required";
  }

  if (!data.password) {
    return "Password is required";
  }

  return null;
};