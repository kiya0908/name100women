import { EXTERNAL_TIMEOUT_MS } from "~/shared/constants";
import type { ExternalCallTelemetry } from "~/shared/types";

export interface ExternalFetchResult {
  response: Response | null;
  telemetry: ExternalCallTelemetry;
}

export async function fetchWithTimeout(
  provider: "wikipedia" | "wikidata",
  operation: string,
  url: string,
  init: RequestInit = {},
  retry = true,
): Promise<ExternalFetchResult> {
  const startedAt = Date.now();
  const requestedAt = new Date(startedAt).toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent":
          "Name100Women/1.0 (https://name100women.top/contact; support@name100women.top)",
        Accept: "application/json",
        ...init.headers,
      },
      signal: controller.signal,
    });

    if (retry && (response.status === 429 || response.status >= 500)) {
      clearTimeout(timeout);
      await sleep(120);
      return fetchWithTimeout(provider, operation, url, init, false);
    }

    return {
      response,
      telemetry: {
        provider,
        operation,
        success: response.ok,
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
        errorCode: response.ok ? null : `HTTP_${response.status}`,
        requestedAt,
      },
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return {
      response: null,
      telemetry: {
        provider,
        operation,
        success: false,
        statusCode: null,
        durationMs: Date.now() - startedAt,
        errorCode: aborted ? "TIMEOUT" : "NETWORK_ERROR",
        requestedAt,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
