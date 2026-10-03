export class InputError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function positiveInteger(
  value: unknown,
  name: string,
  fallback?: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if ((value === undefined || value === null) && fallback !== undefined)
    return fallback;
  if (!/^[1-9]\d*$/.test(String(value)))
    throw new InputError(`Invalid ${name}`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result > max)
    throw new InputError(`Invalid ${name}`);
  return result;
}

export function text(value: unknown, name: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new InputError(`Invalid ${name}`);
  return value.trim();
}

export function identifier(value: unknown): string {
  const result = text(value, "identifier", 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(result))
    throw new InputError("Invalid identifier");
  return result;
}

export function boolean(
  value: unknown,
  name: string,
  fallback?: boolean,
): boolean | undefined {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new InputError(`Invalid ${name}`);
}

export function date(value: unknown, name: string): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new InputError(`Invalid ${name}`);
  return new Date(value);
}

export function publicOrigin(request: Request) {
  // Next may use an internal localhost URL behind a deployment proxy.
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const protocol =
    request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${protocol}://${host}`;
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== publicOrigin(request)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new InputError("Cross-origin request rejected", 403);
  }
}
