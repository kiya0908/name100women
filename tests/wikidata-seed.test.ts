import { describe, expect, it, vi } from "vitest";

import { fetchSeedBindings, seedQuery } from "../scripts/wikidata-seed";

const successBody = {
  results: {
    bindings: [
      {
        person: { value: "https://www.wikidata.org/entity/Q1" },
        personLabel: { value: "Example Person" },
        article: { value: "https://en.wikipedia.org/wiki/Example_Person" },
      },
    ],
  },
};

describe("fetchSeedBindings", () => {
  it("将顶层 SELECT 放在 Blazegraph 命名子查询之前", () => {
    expect(seedQuery.trimStart()).toMatch(/^SELECT[\s\S]+\nWITH \{/u);
  });

  it("使用 POST 提交查询并返回结果", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(successBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const bindings = await fetchSeedBindings({ fetcher });

    expect(bindings).toEqual(successBody.results.bindings);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      new URLSearchParams({ query: seedQuery, format: "json" }).toString(),
    );
  });

  it("不会重试不可恢复的 4xx", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("bad query", { status: 400 }));

    await expect(fetchSeedBindings({ fetcher })).rejects.toThrow(
      "HTTP 400 after 1 attempt",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("在 504 后等待并重试", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("timeout", { status: 504 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(successBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(fetchSeedBindings({ fetcher, sleep })).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(60_000);
  });

  it("连续临时失败后停止", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("timeout", { status: 504 }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(fetchSeedBindings({ fetcher, sleep })).rejects.toThrow(
      "HTTP 504 after 2 attempts",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep).toHaveBeenCalledWith(60_000);
  });
});
