import type { MetaFunction } from "react-router";

import { StaticPage } from "~/components/StaticPage";
import { SITE_URL, SUPPORT_EMAIL } from "~/shared/constants";

export const meta: MetaFunction = () => [
  { title: "How Name Verification Works | Name 100 Women" },
  {
    name: "description",
    content:
      "Learn how Name 100 Women verifies real people using local data, Wikipedia and Wikidata without using an AI model as the deciding authority.",
  },
  {
    tagName: "link",
    rel: "canonical",
    href: `${SITE_URL}/how-it-works`,
  },
];

export default function HowItWorksPage() {
  return (
    <StaticPage
      eyebrow="Technical explanation"
      title="How name verification works"
      intro="The game uses a server-side verification pipeline designed to give fast, repeatable and explainable results."
    >
      <h2>What the system is trying to confirm</h2>
      <p>
        An answer must resolve to one real person, reliable public data must
        identify that person as a woman, and at least one Wikipedia language
        edition must have an article about the person. A stable Wikidata QID is
        used to prevent the same person from scoring twice under different
        spellings or aliases.
      </p>

      <h2>Verification order</h2>
      <ol>
        <li>The request format and name length are checked.</li>
        <li>The name is normalized for spacing and Unicode consistency.</li>
        <li>The game session and lightweight request limits are checked.</li>
        <li>Manual corrections are checked first.</li>
        <li>The server checks the fast KV cache.</li>
        <li>The server checks previously verified people and aliases in D1.</li>
        <li>Wikipedia is used to find the likely page or redirect.</li>
        <li>Wikidata is used to check the entity and obtain its QID.</li>
        <li>The QID is checked against answers already accepted in this game.</li>
        <li>The result is stored for faster future verification.</li>
      </ol>

      <h2>Why Wikipedia and Wikidata have different jobs</h2>
      <p>
        Wikipedia is useful for interpreting names, article titles and
        redirects. Wikidata provides the stable entity identifier and structured
        claims needed for consistent duplicate detection. Neither source is
        treated as infallible, so the system supports manual corrections for
        missing or inaccurate public data.
      </p>

      <h2>What happens with ambiguous names</h2>
      <p>
        When a short name can refer to several people and the server cannot
        confidently identify one person, the answer is marked ambiguous. The
        game does not display a candidate picker because that would reveal
        possible answers. Entering a fuller name is the intended solution.
      </p>

      <h2>What happens during an external service failure</h2>
      <p>
        A timeout or temporary Wikipedia or Wikidata failure is returned as a
        temporary error rather than being treated as an incorrect answer. The
        original entry can then be retried.
      </p>

      <h2>Does the game use an AI model to judge names?</h2>
      <p>
        No. A language model is not used as the real-time authority for whether
        an answer counts. Decisions are based on explicit rules, local records
        and structured public-source data.
      </p>

      <h2>Report a verification problem</h2>
      <p>
        Send the entered name, the result you received and a relevant public
        source to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Do not include
        sensitive personal information.
      </p>
    </StaticPage>
  );
}
