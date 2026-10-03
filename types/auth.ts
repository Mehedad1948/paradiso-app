import type { BackendRequestBody } from "./backend";

export type SignInInputs = BackendRequestBody<"/auth/sign-in", "post">;
export type RegisterInputs = BackendRequestBody<"/users", "post">;
export type VerifyEmailInputs = BackendRequestBody<"/auth/verify-email", "post">;
export type ForgotPasswordInputs = BackendRequestBody<"/auth/forget-password", "post">;
export type ResetPasswordInputs = BackendRequestBody<"/auth/reset-password", "post">;
export type RefreshTokenInputs = BackendRequestBody<"/auth/refresh-tokens", "post">;
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
export interface AuthResult {
  message: string;
  authenticated?: boolean;
}
export type AuthOperation =
  | "sign-in"
  | "register"
  | "verify"
  | "forgot-password"
  | "reset-password"
  | "refresh-token"
  | "sign-out";
