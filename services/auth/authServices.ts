import type {
  ForgotPasswordInputs,
  RefreshTokenInputs,
  ResendVerificationInputs,
  ResetPasswordInputs,
  SignInInputs,
  VerifyEmailInputs,
} from "@/types/auth";
import { backendRequest } from "../backend";

// The backend rate-limits these public routes per client IP, so each takes the visitor's IP.
const authServices = {
  signIn: (body: SignInInputs, clientIp?: string) =>
    backendRequest("/auth/sign-in", "post", { body, withAuth: false, clientIp }),
  verifyEmail: (body: VerifyEmailInputs, clientIp?: string) =>
    backendRequest("/auth/verify-email", "post", { body, withAuth: false, clientIp }),
  resendVerification: (body: ResendVerificationInputs, clientIp?: string) =>
    backendRequest("/auth/resend-verification", "post", { body, withAuth: false, clientIp }),
  forgotPassword: (body: ForgotPasswordInputs, clientIp?: string) =>
    backendRequest("/auth/forget-password", "post", { body, withAuth: false, clientIp }),
  resetPassword: (body: ResetPasswordInputs, clientIp?: string) =>
    backendRequest("/auth/reset-password", "post", { body, withAuth: false, clientIp }),
  refreshToken: (body: RefreshTokenInputs) =>
    backendRequest("/auth/refresh-tokens", "post", { body, withAuth: false }),
};

export default authServices;
