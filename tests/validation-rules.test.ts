import { describe, expect, it } from "vitest";

import { classifyPerson } from "../app/server/services/validation.service";

const valid = {
  isHuman: true,
  qualifiesAsWoman: true,
  hasWikipediaSitelink: true,
  isFictional: false,
};

describe("classifyPerson", () => {
  it("accepts a qualifying real person", () => {
    expect(classifyPerson(valid)).toBe("ACCEPTED");
  });

  it("distinguishes fictional, non-person and non-woman results", () => {
    expect(classifyPerson({ ...valid, isFictional: true })).toBe("FICTIONAL");
    expect(classifyPerson({ ...valid, isHuman: false })).toBe("NOT_A_PERSON");
    expect(classifyPerson({ ...valid, qualifiesAsWoman: false })).toBe(
      "NOT_A_WOMAN",
    );
    expect(classifyPerson({ ...valid, hasWikipediaSitelink: false })).toBe(
      "NOT_FOUND",
    );
  });
});
