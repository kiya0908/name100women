const endpoint = "https://query.wikidata.org/sparql";
const maxAttempts = 2;

export const seedQuery = `
SELECT ?person ?personLabel ?personDescription ?article ?sitelinks
WITH {
  SELECT DISTINCT ?person ?sitelinks WHERE {
    VALUES ?gender { wd:Q6581072 wd:Q1052281 wd:Q15145779 }
    ?person wdt:P31 wd:Q5;
            wdt:P21 ?gender;
            wikibase:sitelinks ?sitelinks.
    FILTER(?sitelinks >= 20)
  }
  ORDER BY DESC(?sitelinks)
  LIMIT 1000
} AS %topPeople

WHERE {
  INCLUDE %topPeople.
  ?article schema:about ?person;
           schema:isPartOf <https://en.wikipedia.org/>.
  ?person rdfs:label ?personLabel.
  FILTER(LANG(?personLabel) = "en")
  OPTIONAL {
    ?person schema:description ?personDescription.
    FILTER(LANG(?personDescription) = "en")
  }
}
ORDER BY DESC(?sitelinks)
`;

export interface SeedBinding {
  person: { value: string };
  personLabel: { value: string };
  personDescription?: { value: string };
  article: { value: string };
}

interface SparqlResponse {
  results: {
    bindings: SeedBinding[];
  };
}

interface FetchSeedOptions {
  fetcher?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
}

export async function fetchSeedBindings({
  fetcher = fetch,
  sleep = delay,
}: FetchSeedOptions = {}): Promise<SeedBinding[]> {
  const body = new URLSearchParams({ query: seedQuery, format: "json" }).toString();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent":
          "Name100WomenSeed/1.0 (https://name100women.top/contact; support@name100women.top)",
      },
      body,
    });

    if (response.ok) {
      const data = (await response.json()) as SparqlResponse;
      return data.results.bindings;
    }

    const canRetry = response.status === 429 || response.status >= 500;
    const isLastAttempt = attempt === maxAttempts - 1;
    if (!canRetry || isLastAttempt) {
      const responseText = (await response.text()).trim();
      const responseSummary =
        responseText.length <= 1_000
          ? responseText
          : `${responseText.slice(0, 200)} ... ${responseText.slice(-800)}`;
      throw new Error(
        `Wikidata seed query failed with HTTP ${response.status} after ${attempt + 1} attempt${attempt === 0 ? "" : "s"}${responseSummary ? `: ${responseSummary}` : ""}`,
      );
    }

    const retryDelay =
      response.status === 429 || response.status === 504 ? 60_000 : 5_000;
    console.warn(
      `Wikidata seed query returned HTTP ${response.status}; retrying once in ${retryDelay / 1000}s.`,
    );
    await sleep(retryDelay);
  }

  throw new Error("Wikidata seed query exhausted its attempts unexpectedly");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
