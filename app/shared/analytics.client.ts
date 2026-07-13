const BLOCKED_PARAMETER_PATTERN = /(name|qid|input|person|ip|token)/iu;

export function trackGameEvent(
  eventName: string,
  parameters: Record<string, string | number | boolean | null | undefined> = {},
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, sanitizeAnalyticsParameters(parameters));
}

export function sanitizeAnalyticsParameters(
  parameters: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(parameters).filter(
      ([key, value]) =>
        !BLOCKED_PARAMETER_PATTERN.test(key) &&
        ["string", "number", "boolean"].includes(typeof value),
    ),
  ) as Record<string, string | number | boolean>;
}
