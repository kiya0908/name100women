import { describe, expect, it } from "vitest";

import { sanitizeAnalyticsParameters } from "../app/shared/analytics.client";

describe("analytics privacy", () => {
  it("removes names, QIDs, input, IP and token-like parameters", () => {
    expect(
      sanitizeAnalyticsParameters({
        progress: 25,
        duration_seconds: 80,
        person_name: "Marie Curie",
        qid: "Q7186",
        raw_input: "Marie Curie",
        ip_hash: "hash",
        cookie_token: "secret",
      }),
    ).toEqual({
      progress: 25,
      duration_seconds: 80,
    });
  });
});
