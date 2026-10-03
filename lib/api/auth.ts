import { apiRequest } from "./client";
import type {
  AuthResult,
  SignInInputs,
  RegisterInputs,
  VerifyEmailInputs,
  ForgotPasswordInputs,
  ResetPasswordInputs,
} from "@/types/auth";
const post = (operation: string, data?: unknown) =>
  apiRequest<AuthResult>(`/api/auth/${operation}`, {
    method: "POST",
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
export const authApi = {
  signIn: (data: SignInInputs) => post("sign-in", data),
  register: (data: RegisterInputs) => post("register", data),
  verify: (data: VerifyEmailInputs) => post("verify", data),
  forgotPassword: (data: ForgotPasswordInputs) => post("forgot-password", data),
  resetPassword: (data: ResetPasswordInputs) => post("reset-password", data),
  refresh: () => post("refresh-token"),
  signOut: () => post("sign-out"),
};
