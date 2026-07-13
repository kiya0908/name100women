import { describe, expect, it } from "vitest";

import { buildShareText, formatDuration } from "../app/shared/result";

describe("result formatting", () => {
  it("formats elapsed time", () => {
    expect(formatDuration(123_999)).toBe("2:03");
  });

  it("builds a completed result without personal data", () => {
    expect(buildShareText("completed", 100, 123_000)).toContain(
      "I named 100 women in 2:03",
    );
  });
});
