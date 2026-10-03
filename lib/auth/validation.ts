import { InputError } from "@/lib/bff/validation";

export const PASSWORD_MIN_LENGTH = 6;
export function emailInput(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new InputError("Enter a valid email address.");
  return value.trim();
}
export function passwordInput(value: unknown, isNew = false): string {
  if (typeof value !== "string" || !value || value.length > 128)
    throw new InputError("Enter your password (up to 128 characters).");
  if (isNew && value.length < PASSWORD_MIN_LENGTH)
    throw new InputError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    );
  return value;
}
export function codeInput(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}$/.test(value))
    throw new InputError("Enter the four-digit verification code.");
  return value;
}
export function usernameInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100)
    throw new InputError("Enter a username (up to 100 characters).");
  return value.trim();
}
export function confirmPassword(password: string, confirmation: string) {
  passwordInput(password, true);
  if (password !== confirmation)
    throw new InputError("Passwords do not match.");
}
