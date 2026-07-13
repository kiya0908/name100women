import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );

  return files.flat();
}

describe("服务端模块边界", () => {
  it("服务端代码不得使用 React Router 的 .client 文件后缀", async () => {
    const serverDirectory = path.resolve("app/server");
    const files = await listFiles(serverDirectory);
    const clientOnlyModules = files
      .filter((file) => /\.client\.[cm]?[jt]sx?$/u.test(file))
      .map((file) => path.relative(process.cwd(), file));

    expect(clientOnlyModules).toEqual([]);
  });
});
