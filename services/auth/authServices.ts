import { WebServices } from "..";
import {
  ForgotPasswordInputs,
  RefreshTokenInputs,
  RegisterInputs,
  ResetPasswordInputs,
  SignInInputs,
  VerifyEmailInputs,
} from "./types";

 class AuthServices {
  private webService = new WebServices("/auth");

  async signIn(body: SignInInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>("/sign-in", {
      body,
    });
    return res;
  }



  async verifyEmail(body: VerifyEmailInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>(`/verify-email`, {
      body,
    });
    return res;
  }

  async forgotPassword(body: ForgotPasswordInputs) {
    const res = await this.webService.post(`/forget-password`, {
      body,
    });
    return res;
  }

  async resetPassword(body: ResetPasswordInputs) {
    const res = await this.webService.post(`/reset-password`, {
      body,
    });
    return res;
  }

  async refreshToken(body: RefreshTokenInputs) {
    const res = await this.webService.post<{
      accessToken: string;
      refreshToken: string;
    }>(`/refresh-tokens`, {
      body,
    });
    return res;
  }
}

 const authServices = new AuthServices();

 export default authServices;

// testtest@Password123.com
