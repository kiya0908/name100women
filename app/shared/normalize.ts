export function normalizeName(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en-US");
}

export function normalizeDisplayName(input: string): string {
  return input.normalize("NFKC").trim().replace(/\s+/gu, " ");
}
