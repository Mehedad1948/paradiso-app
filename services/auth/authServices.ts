import type {
  TokenPair,
  ForgotPasswordInputs,
  RefreshTokenInputs,
  ResetPasswordInputs,
  SignInInputs,
  VerifyEmailInputs,
} from "@/types/auth";
import { WebServices } from "..";
class AuthServices {
  private webService = new WebServices("/auth");
  signIn(body: SignInInputs) {
    return this.webService.post<TokenPair>("/sign-in", {
      body,
      withAuth: false,
    });
  }
  verifyEmail(body: VerifyEmailInputs) {
    return this.webService.post<TokenPair>("/verify-email", {
      body,
      withAuth: false,
    });
  }
  forgotPassword(body: ForgotPasswordInputs) {
    return this.webService.post("/forget-password", { body, withAuth: false });
  }
  resetPassword(body: ResetPasswordInputs) {
    return this.webService.post("/reset-password", { body, withAuth: false });
  }
  refreshToken(body: RefreshTokenInputs) {
    return this.webService.post<TokenPair>("/refresh-tokens", {
      body,
      withAuth: false,
    });
  }
}
export default new AuthServices();
