import type { MetaFunction } from "react-router";

import { StaticPage } from "~/components/StaticPage";
import { SITE_URL, SUPPORT_EMAIL } from "~/shared/constants";

export const meta: MetaFunction = () => [
  { title: "Terms of Use | Name 100 Women" },
  {
    name: "description",
    content:
      "Terms for using the Name 100 Women timed memory challenge and its public-data name verification service.",
  },
  { tagName: "link", rel: "canonical", href: `${SITE_URL}/terms` },
];

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Terms of use"
      intro="By using Name 100 Women, you agree to the following terms."
    >
      <p>
        <strong>Last updated:</strong> July 13, 2026
      </p>

      <h2>Purpose of the service</h2>
      <p>
        Name 100 Women is a free memory and trivia challenge. It is provided for
        entertainment and general educational use. The service is not a
        definitive biographical database.
      </p>

      <h2>Verification limitations</h2>
      <p>
        Results depend on local records and public information from services
        including Wikipedia and Wikidata. Public data can be incomplete,
        delayed, ambiguous or incorrect. A rejected answer does not make a claim
        about a person&apos;s real identity; it means the service could not
        verify the entry under the current game rules.
      </p>

      <h2>Acceptable use</h2>
      <p>You may not:</p>
      <ul>
        <li>Attempt to disrupt, overload or bypass request limits.</li>
        <li>Use automated requests that materially interfere with other users.</li>
        <li>Probe for secrets, private data or unauthorized system access.</li>
        <li>Submit unlawful content through support or feedback channels.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        The service may be changed, suspended or discontinued without notice.
        External verification services can also be unavailable. No guarantee is
        made that every valid person will be recognized or that every result
        will be immediate.
      </p>

      <h2>Intellectual property and public data</h2>
      <p>
        The website interface, original text and code are protected by
        applicable law. Names and factual descriptions may come from public
        sources and remain subject to the terms and licenses of those sources.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided on an “as is” and “as available” basis, without
        warranties of accuracy, availability or fitness for a particular
        purpose, to the extent permitted by law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, the operator is not liable for indirect,
        incidental or consequential loss arising from use of, or inability to
        use, the service.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </StaticPage>
  );
}
