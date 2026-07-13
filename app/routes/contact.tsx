import type { MetaFunction } from "react-router";

import { StaticPage } from "~/components/StaticPage";
import { SITE_URL, SUPPORT_EMAIL } from "~/shared/constants";

export const meta: MetaFunction = () => [
  { title: "Contact and Report a Name | Name 100 Women" },
  {
    name: "description",
    content:
      "Contact Name 100 Women to report an incorrect, missing or ambiguous name verification result.",
  },
  { tagName: "link", rel: "canonical", href: `${SITE_URL}/contact` },
];

export default function ContactPage() {
  const verificationSubject = encodeURIComponent(
    "Name verification report — Name 100 Women",
  );

  return (
    <StaticPage
      eyebrow="Support"
      title="Contact and verification reports"
      intro="Use email to report a name that was incorrectly accepted, rejected, duplicated or marked ambiguous."
    >
      <h2>Report a name result</h2>
      <p>Please include:</p>
      <ul>
        <li>The exact name you entered.</li>
        <li>The status or message shown by the game.</li>
        <li>What result you expected.</li>
        <li>A relevant Wikipedia, Wikidata or other reliable public source.</li>
      </ul>
      <p>
        <a
          className="primary-button inline-button"
          href={`mailto:${SUPPORT_EMAIL}?subject=${verificationSubject}`}
        >
          Email a verification report
        </a>
      </p>

      <h2>General contact</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for
        technical problems, privacy questions or other feedback.
      </p>

      <h2>Do not send sensitive information</h2>
      <p>
        Do not include passwords, identification documents, private health
        information or other sensitive personal data. The project does not need
        that information to review a public name-matching issue.
      </p>

      <h2>Response expectations</h2>
      <p>
        This is an early-stage website. Reports are reviewed as capacity allows,
        and a personal response is not guaranteed. Repeated reports help
        prioritize corrections and manual overrides.
      </p>
    </StaticPage>
  );
}
