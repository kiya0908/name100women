import { z } from "zod";

import type { ExternalCallTelemetry } from "~/shared/types";

import { fetchWithTimeout } from "./fetch-with-timeout";

const entityResponseSchema = z.object({
  entities: z.record(z.string(), z.unknown()),
});

const HUMAN_QID = "Q5";
const WOMAN_GENDER_QIDS = new Set([
  "Q6581072", // female
  "Q1052281", // transgender woman
  "Q15145779", // cisgender woman
]);
const FICTIONAL_INSTANCE_QIDS = new Set([
  "Q95074",
  "Q15632617",
  "Q15773347",
]);

export interface WikidataPerson {
  qid: string;
  canonicalName: string;
  description: string | null;
  isHuman: boolean;
  qualifiesAsWoman: boolean;
  hasWikipediaSitelink: boolean;
  isFictional: boolean;
}

export interface WikidataLookup {
  status: "FOUND" | "NOT_FOUND" | "TEMPORARY_ERROR";
  person: WikidataPerson | null;
  telemetry: ExternalCallTelemetry[];
}

export class WikidataClient {
  async getPerson(qid: string): Promise<WikidataLookup> {
    const result = await fetchWithTimeout(
      "wikidata",
      "entity",
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(
        qid,
      )}.json`,
    );

    if (!result.response) {
      return {
        status: "TEMPORARY_ERROR",
        person: null,
        telemetry: [result.telemetry],
      };
    }

    if (!result.response.ok) {
      return {
        status:
          result.response.status >= 500 || result.response.status === 429
            ? "TEMPORARY_ERROR"
            : "NOT_FOUND",
        person: null,
        telemetry: [result.telemetry],
      };
    }

    const parsed = entityResponseSchema.safeParse(await result.response.json());
    if (!parsed.success) {
      return {
        status: "TEMPORARY_ERROR",
        person: null,
        telemetry: [
          { ...result.telemetry, success: false, errorCode: "SCHEMA_ERROR" },
        ],
      };
    }

    const entity = parsed.data.entities[qid] as WikidataEntity | undefined;
    if (!entity || entity.missing !== undefined) {
      return {
        status: "NOT_FOUND",
        person: null,
        telemetry: [result.telemetry],
      };
    }

    const instanceOf = claimEntityIds(entity, "P31");
    const genders = claimEntityIds(entity, "P21");
    const isFictional = instanceOf.some((id) =>
      FICTIONAL_INSTANCE_QIDS.has(id),
    );
    const isHuman = instanceOf.includes(HUMAN_QID);
    const qualifiesAsWoman = genders.some((id) => WOMAN_GENDER_QIDS.has(id));
    const hasWikipediaSitelink = Object.keys(entity.sitelinks ?? {}).some(
      (key) =>
        key.endsWith("wiki") &&
        key !== "commonswiki" &&
        key !== "wikidatawiki",
    );

    return {
      status: "FOUND",
      person: {
        qid,
        canonicalName:
          entity.labels?.en?.value ??
          Object.values(entity.labels ?? {})[0]?.value ??
          qid,
        description:
          entity.descriptions?.en?.value ??
          Object.values(entity.descriptions ?? {})[0]?.value ??
          null,
        isHuman,
        qualifiesAsWoman,
        hasWikipediaSitelink,
        isFictional,
      },
      telemetry: [result.telemetry],
    };
  }
}

interface WikidataEntity {
  missing?: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: {
          value?: {
            id?: string;
          };
        };
      };
    }>
  >;
  sitelinks?: Record<string, unknown>;
}

function claimEntityIds(entity: WikidataEntity, property: string): string[] {
  return (entity.claims?.[property] ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter((value): value is string => typeof value === "string");
}
