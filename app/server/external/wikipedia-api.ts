import { z } from "zod";

import type { ExternalCallTelemetry } from "~/shared/types";
import { normalizeName } from "~/shared/normalize";

import { fetchWithTimeout } from "./fetch-with-timeout";

const pageSchema = z.object({
  pageid: z.number().optional(),
  title: z.string(),
  missing: z.boolean().optional(),
  description: z.string().optional(),
  pageprops: z
    .object({
      wikibase_item: z.string().optional(),
      disambiguation: z.string().optional(),
    })
    .optional(),
});

const responseSchema = z.object({
  query: z
    .object({
      pages: z.array(pageSchema).optional(),
    })
    .optional(),
});

export interface WikipediaCandidate {
  qid: string;
  title: string;
  description: string | null;
  wikipediaUrl: string;
  aliases: string[];
}

export interface WikipediaDiscovery {
  status: "FOUND" | "NOT_FOUND" | "AMBIGUOUS" | "TEMPORARY_ERROR";
  candidate: WikipediaCandidate | null;
  telemetry: ExternalCallTelemetry[];
}

export class WikipediaClient {
  async discover(input: string): Promise<WikipediaDiscovery> {
    const exact = await this.fetchExact(input);
    if (exact.status === "FOUND" || exact.status === "TEMPORARY_ERROR") {
      return exact;
    }

    const search = await this.search(input);
    return {
      ...search,
      telemetry: [...exact.telemetry, ...search.telemetry],
    };
  }

  private async fetchExact(input: string): Promise<WikipediaDiscovery> {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: "pageprops|description",
      ppprop: "wikibase_item|disambiguation",
      titles: input,
    });

    const result = await fetchWithTimeout(
      "wikipedia",
      "exact",
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
    );

    if (!result.response) {
      return {
        status: "TEMPORARY_ERROR",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    if (!result.response.ok) {
      return {
        status:
          result.response.status >= 500 || result.response.status === 429
            ? "TEMPORARY_ERROR"
            : "NOT_FOUND",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    const parsed = responseSchema.safeParse(await result.response.json());
    if (!parsed.success) {
      return {
        status: "TEMPORARY_ERROR",
        candidate: null,
        telemetry: [
          { ...result.telemetry, success: false, errorCode: "SCHEMA_ERROR" },
        ],
      };
    }

    const page = parsed.data.query?.pages?.[0];
    if (
      !page ||
      page.missing ||
      page.pageprops?.disambiguation !== undefined ||
      !page.pageprops?.wikibase_item
    ) {
      return {
        status:
          page?.pageprops?.disambiguation !== undefined
            ? "AMBIGUOUS"
            : "NOT_FOUND",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    return {
      status: "FOUND",
      candidate: toCandidate(page, input),
      telemetry: [result.telemetry],
    };
  }

  private async search(input: string): Promise<WikipediaDiscovery> {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      generator: "search",
      gsrsearch: input,
      gsrnamespace: "0",
      gsrlimit: "5",
      prop: "pageprops|description",
      ppprop: "wikibase_item|disambiguation",
    });

    const result = await fetchWithTimeout(
      "wikipedia",
      "search",
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
    );

    if (!result.response) {
      return {
        status: "TEMPORARY_ERROR",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    if (!result.response.ok) {
      return {
        status:
          result.response.status >= 500 || result.response.status === 429
            ? "TEMPORARY_ERROR"
            : "NOT_FOUND",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    const parsed = responseSchema.safeParse(await result.response.json());
    if (!parsed.success) {
      return {
        status: "TEMPORARY_ERROR",
        candidate: null,
        telemetry: [
          { ...result.telemetry, success: false, errorCode: "SCHEMA_ERROR" },
        ],
      };
    }

    const pages = (parsed.data.query?.pages ?? []).filter(
      (page) =>
        page.pageprops?.wikibase_item &&
        page.pageprops.disambiguation === undefined,
    );

    if (pages.length === 0) {
      return {
        status: "NOT_FOUND",
        candidate: null,
        telemetry: [result.telemetry],
      };
    }

    const exactTitleMatches = pages.filter(
      (page) => normalizeName(page.title) === normalizeName(input),
    );

    if (exactTitleMatches.length === 1) {
      return {
        status: "FOUND",
        candidate: toCandidate(exactTitleMatches[0], input),
        telemetry: [result.telemetry],
      };
    }

    if (pages.length === 1) {
      return {
        status: "FOUND",
        candidate: toCandidate(pages[0], input),
        telemetry: [result.telemetry],
      };
    }

    return {
      status: "AMBIGUOUS",
      candidate: null,
      telemetry: [result.telemetry],
    };
  }
}

function toCandidate(
  page: z.infer<typeof pageSchema>,
  originalInput: string,
): WikipediaCandidate {
  return {
    qid: page.pageprops?.wikibase_item ?? "",
    title: page.title,
    description: page.description ?? null,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(
      page.title.replace(/ /gu, "_"),
    )}`,
    aliases:
      normalizeName(page.title) === normalizeName(originalInput)
        ? [page.title]
        : [page.title, originalInput],
  };
}
