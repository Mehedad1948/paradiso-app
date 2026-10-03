export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
) {
  if (
    !value ||
    value.length > 4096 ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.startsWith("//") ||
      /[\\\u0000-\u0020\u007f]/.test(decoded.split(/[?#]/)[0])
    )
      return fallback;
    const url = new URL(value, "https://paradiso.local");
    if (
      url.origin !== "https://paradiso.local" ||
      /^\/(auth|api)(\/|$)/.test(decodeURIComponent(url.pathname))
    )
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authHref(
  page: string,
  params: Record<string, string | undefined> = {},
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `/auth/${page}${query.size ? `?${query}` : ""}`;
}
