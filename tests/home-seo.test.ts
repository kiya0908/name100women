import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "../app/routes/home";

const PRIMARY_KEYWORD = "name 100 women";

function getVisibleText(markup: string) {
  return markup
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:#x27|#39|apos);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function countEnglishWords(text: string) {
  return text.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g)?.length ?? 0;
}

function countPhrase(text: string, phrase: string) {
  return text.toLowerCase().split(phrase).length - 1;
}

describe("home page SEO content", () => {
  const markup = renderToStaticMarkup(createElement(HomePage));
  const visibleText = getVisibleText(markup);

  it("keeps the playable game before the long-form content", () => {
    expect(markup.indexOf('id="game-heading"')).toBeGreaterThan(-1);
    expect(markup.indexOf('id="game-heading"')).toBeLessThan(
      markup.indexOf("How to play Name 100 Women"),
    );
  });

  it("contains 1,200 to 1,800 visible English words", () => {
    const wordCount = countEnglishWords(visibleText);
    expect(wordCount).toBeGreaterThanOrEqual(1_200);
    expect(wordCount).toBeLessThanOrEqual(1_800);
  });

  it("keeps weighted primary-keyword density between 3.5% and 5%", () => {
    const wordCount = countEnglishWords(visibleText);
    const phraseOccurrences = countPhrase(visibleText, PRIMARY_KEYWORD);
    const weightedDensity = (phraseOccurrences * 3 * 100) / wordCount;

    expect(weightedDensity).toBeGreaterThanOrEqual(3.5);
    expect(weightedDensity).toBeLessThanOrEqual(5);
  });

  it("links to supporting explanation, contact and privacy pages", () => {
    expect(markup).toContain('href="/how-it-works"');
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain('href="/privacy"');
  });
});

