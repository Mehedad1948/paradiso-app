export interface SignInInputs {
  email: string;
  password: string;
}
export interface RegisterInputs extends SignInInputs {
  username: string;
}
export interface VerifyEmailInputs {
  email: string;
  code: string;
}
export interface ForgotPasswordInputs {
  email: string;
}
export interface ResetPasswordInputs extends VerifyEmailInputs {
  password: string;
}
export interface RefreshTokenInputs {
  refreshToken: string;
}
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
