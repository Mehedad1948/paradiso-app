import type {
  ForgotPasswordInputs,
  RefreshTokenInputs,
  ResetPasswordInputs,
  SignInInputs,
  VerifyEmailInputs,
} from "@/types/auth";
import { backendRequest } from "../backend";

const authServices = {
  signIn: (body: SignInInputs) =>
    backendRequest("/auth/sign-in", "post", { body, withAuth: false }),
  verifyEmail: (body: VerifyEmailInputs) =>
    backendRequest("/auth/verify-email", "post", { body, withAuth: false }),
  forgotPassword: (body: ForgotPasswordInputs) =>
    backendRequest("/auth/forget-password", "post", { body, withAuth: false }),
  resetPassword: (body: ResetPasswordInputs) =>
    backendRequest("/auth/reset-password", "post", { body, withAuth: false }),
  refreshToken: (body: RefreshTokenInputs) =>
    backendRequest("/auth/refresh-tokens", "post", { body, withAuth: false }),
};

export default authServices;
