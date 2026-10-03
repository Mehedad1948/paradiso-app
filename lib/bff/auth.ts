import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import authServices from "@/services/auth/authServices";
import usersServices from "@/services/user";
import type { AuthOperation, AuthResult } from "@/types/auth";
import type { RequestResult } from "@/types/request";
import { InputError, assertSameOrigin } from "./validation";
import {
  emailInput,
  passwordInput,
  codeInput,
  usernameInput,
} from "@/lib/auth/validation";
import { clearSession, hasTokenPair, setSession } from "@/lib/auth/session";

const operations = new Set<AuthOperation>([
  "sign-in",
  "register",
  "verify",
  "forgot-password",
  "reset-password",
  "refresh-token",
  "sign-out",
]);
function success(message: string, authenticated?: boolean) {
  return respond({
    result: {
      message,
      ...(authenticated === undefined ? {} : { authenticated }),
    },
    response: { ok: true, status: 200, statusText: "OK" },
  });
}
function failure(status: number, message: string) {
  return respond({
    result: null,
    response: { ok: false, status, statusText: "", message },
  });
}
function respond(result: RequestResult<AuthResult>) {
  return NextResponse.json(result, {
    status: result.response.status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
function upstreamFailure(
  result: RequestResult<unknown>,
  operation: AuthOperation,
) {
  const status =
    result.response.status >= 400 && result.response.status < 500
      ? result.response.status
      : 502;
  let message =
    result.response.message ||
    "The request could not be completed. Please try again.";
  if (status >= 500)
    message = "The service is temporarily unavailable. Please try again.";
  else if (operation === "sign-in" && status === 401)
    message = "Your email or password is incorrect.";
  else if (operation === "register" && status === 409)
    message =
      "An account with those details already exists. Sign in or use different details.";
  return failure(status, message);
}

export async function handleAuthRequest(request: Request, operation: string) {
  try {
    if (request.method !== "POST")
      return failure(405, "Use POST for authentication requests.");
    assertSameOrigin(request);
    if (!operations.has(operation as AuthOperation))
      return failure(404, "Authentication operation not found.");
    const action = operation as AuthOperation;
    if (action === "sign-out") {
      await clearSession();
      return success("You have been signed out.", false);
    }
    if (action === "refresh-token") {
      const token = (await cookies()).get("refreshToken")?.value;
      if (!token) {
        await clearSession();
        return failure(401, "Your session has expired. Sign in to continue.");
      }
      // The backend validates refresh tokens, which may use a different secret or be opaque.
      const result = await authServices.refreshToken({ refreshToken: token });
      if (!result.response.ok) {
        if ([400, 401, 403].includes(result.response.status)) {
          await clearSession();
          return failure(401, "Your session has expired. Sign in to continue.");
        }
        return upstreamFailure(result, action);
      }
      if (!hasTokenPair(result.result) || !(await setSession(result.result)))
        return failure(
          502,
          "Unable to renew your session. Please sign in again.",
        );
      return success("Your session has been renewed.", true);
    }
    let data: Record<string, unknown>;
    try {
      const value: unknown = await request.json();
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error();
      data = value as Record<string, unknown>;
    } catch {
      throw new InputError("Invalid authentication request.");
    }
    const email = emailInput(data.email);
    if (action === "sign-in" || action === "verify") {
      const result =
        action === "sign-in"
          ? await authServices.signIn({
              email,
              password: passwordInput(data.password),
            })
          : await authServices.verifyEmail({
              email,
              code: codeInput(data.code),
            });
      if (!result.response.ok) return upstreamFailure(result, action);
      if (hasTokenPair(result.result)) {
        if (!(await setSession(result.result)))
          return failure(
            502,
            "Unable to establish your session. Please sign in again.",
          );
        return success(
          action === "verify"
            ? "Your email has been verified."
            : "You are signed in.",
          true,
        );
      }
      // Some backends verify the address without issuing a session.
      if (
        action === "verify" &&
        !(
          result.result &&
          typeof result.result === "object" &&
          ("accessToken" in result.result || "refreshToken" in result.result)
        )
      )
        return success(
          "Your email has been verified. Sign in to continue.",
          false,
        );
      return failure(
        502,
        "Unable to establish your session. Please try again.",
      );
    }
    if (action === "register") {
      const result = await usersServices.register({
        email,
        password: passwordInput(data.password, true),
        username: usernameInput(data.username),
      });
      return result.response.ok
        ? success(
            "Account created. Check your email for the verification code.",
          )
        : upstreamFailure(result, action);
    }
    if (action === "forgot-password") {
      const result = await authServices.forgotPassword({ email });
      return result.response.ok
        ? success("Check your email for the password reset code.")
        : upstreamFailure(result, action);
    }
    const result = await authServices.resetPassword({
      email,
      code: codeInput(data.code),
      password: passwordInput(data.password, true),
    });
    if (!result.response.ok) return upstreamFailure(result, action);
    await clearSession();
    return success(
      "Your password has been reset. Sign in with your new password.",
      false,
    );
  } catch (error) {
    return failure(
      error instanceof InputError ? error.status : 502,
      error instanceof InputError
        ? error.message
        : "The service is temporarily unavailable. Please try again.",
    );
  }
}
