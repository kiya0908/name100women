import { describe, expect, it } from "vitest";

import { normalizeDisplayName, normalizeName } from "../app/shared/normalize";

describe("normalizeName", () => {
  it("normalizes Unicode, whitespace and case", () => {
    expect(normalizeName("  MARIE   Curie  ")).toBe("marie curie");
    expect(normalizeName("Ａｄａ　Lovelace")).toBe("ada lovelace");
  });

  it("keeps accents while normalizing presentation", () => {
    expect(normalizeName("Beyoncé")).toBe("beyoncé");
    expect(normalizeDisplayName("  Beyoncé   Knowles ")).toBe(
      "Beyoncé Knowles",
    );
  });
});
