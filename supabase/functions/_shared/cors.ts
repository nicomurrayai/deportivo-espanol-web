const DEFAULT_ALLOWED_ORIGINS = ["*"];

const DEFAULT_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
];

const DEFAULT_ALLOWED_METHODS = ["POST", "OPTIONS"];

export function getAllowedOrigins(): string[] {
  return DEFAULT_ALLOWED_ORIGINS;
}

export function resolveAllowedOrigin(
  origin: string | null,
  allowedOrigins: string[],
): string | null {
  if (!origin) {
    return null;
  }

  if (allowedOrigins.includes("*")) {
    return origin;
  }

  return allowedOrigins.includes(origin) ? origin : null;
}

export function buildCorsHeaders(
  origin: string | null,
  allowedOrigins: string[],
): Record<string, string> {
  const resolvedOrigin = resolveAllowedOrigin(origin, allowedOrigins);
  const fallbackOrigin = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins[0] ?? DEFAULT_ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": resolvedOrigin ?? fallbackOrigin,
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS.join(", "),
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS.join(", "),
    Vary: "Origin",
  };
}