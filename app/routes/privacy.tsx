import type { MetaFunction } from "react-router";

import { StaticPage } from "~/components/StaticPage";
import { SITE_URL, SUPPORT_EMAIL } from "~/shared/constants";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy | Name 100 Women" },
  {
    name: "description",
    content:
      "Privacy information for the Name 100 Women game, including anonymous sessions, answer validation data, analytics and contact details.",
  },
  { tagName: "link", rel: "canonical", href: `${SITE_URL}/privacy` },
];

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="This policy explains what the Name 100 Women website records during the MVP and why."
    >
      <p>
        <strong>Last updated:</strong> July 13, 2026
      </p>

      <h2>Data recorded when you play</h2>
      <p>
        The game creates an anonymous session and records submitted answer text,
        normalized answer text, verification status, timing, game progress and
        technical performance data. Submitted names are retained because they
        are necessary to investigate missed matches, ambiguous results and
        verification quality.
      </p>

      <h2>Anonymous browser identifier</h2>
      <p>
        The site may set a long-lived, HttpOnly cookie containing a random
        token. The server stores only a one-way hash of that token. It is used
        to understand repeat play and is not intended to identify a real person.
      </p>

      <h2>Network and device information</h2>
      <p>
        The service may record a country code supplied by Cloudflare, broad
        device and browser categories, referrer, landing path and a rotated hash
        derived from the connecting IP address. The raw IP address is not used
        as a public identifier.
      </p>

      <h2>Analytics</h2>
      <p>
        Google Analytics 4 and Microsoft Clarity may be used to understand page
        visits, game starts, progress, completion and interface behavior. Game
        analytics events are designed not to send submitted names, normalized
        names, Wikidata QIDs, IP addresses or anonymous cookie tokens.
      </p>

      <h2>External verification services</h2>
      <p>
        When a name is not already available locally, the server may send that
        name to Wikipedia and request structured entity data from Wikidata.
        These services operate under their own privacy policies.
      </p>

      <h2>How data is used</h2>
      <ul>
        <li>To operate the game and prevent duplicate answers.</li>
        <li>To improve name matching and correct false results.</li>
        <li>To measure whether the website is useful and reliable.</li>
        <li>To limit abusive or automated traffic.</li>
        <li>To diagnose errors and external service failures.</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        During the MVP, gameplay records may be retained while the verification
        system is evaluated. Retention periods may be shortened after enough
        usage data exists to define an appropriate deletion policy. Cached
        public person records may be retained longer to improve performance.
      </p>

      <h2>Your choices</h2>
      <p>
        You can stop using the game, clear site cookies in your browser and use
        browser controls that restrict analytics scripts. Because sessions are
        anonymous, locating a specific gameplay record may not always be
        possible without sufficient technical details.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </StaticPage>
  );
}
