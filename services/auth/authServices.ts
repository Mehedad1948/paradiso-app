import { WebServices } from "..";
import {
  ForgotPasswordInputs,
  RefreshTokenInputs,
  RegisterInputs,
  ResetPasswordInputs,
  SignInInputs,
  VerifyEmailInputs,
} from "./types";

export class AuthServices {
  private webService = new WebServices();

  async signIn(body: SignInInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/sign-in", {
      body,
    });
    return res;
  }

  async register(body: RegisterInputs) {
    const res = await this.webService.post(`/users`, {
      body,
    });
    return res;
  }

  async verifyEmail(body: VerifyEmailInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>(`/auth/verify-email`, {
      body,
    });
    return res;
  }

  async forgotPassword(body: ForgotPasswordInputs) {
    const res = await this.webService.post(`/auth/forget-password`, {
      body,
    });
    return res;
  }

  async resetPassword(body: ResetPasswordInputs) {
    const res = await this.webService.post(`/auth/reset-password`, {
      body,
    });
    return res;
  }

  async refreshToken(body: RefreshTokenInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>(`/auth/refresh-tokens`, {
      body,
    });
    return res;
  }
}
// testtest@Password123.com
