import type { MetaFunction } from "react-router";

import { Game } from "~/components/Game";
import { SITE_URL } from "~/shared/constants";

export const meta: MetaFunction = () => [
  { title: "Name 100 Women Game – Can You Name 100 Women?" },
  {
    name: "description",
    content:
      "Play Name 100 Women, a free timed memory challenge. Enter 100 real women with no repeats. The timer starts after your first correct answer.",
  },
  { tagName: "link", rel: "canonical", href: SITE_URL },
  { property: "og:type", content: "website" },
  { property: "og:url", content: SITE_URL },
  {
    property: "og:title",
    content: "Can You Name 100 Women?",
  },
  {
    property: "og:description",
    content:
      "Type the names of 100 real women. No repeats. No sign-up.",
  },
  { name: "twitter:card", content: "summary" },
];

const faq = [
  {
    question: "What counts as a correct answer?",
    answer:
      "A name counts when it can be matched to a real person whom reliable public data identifies as a woman and who has a Wikipedia page.",
  },
  {
    question: "Do nicknames and stage names count?",
    answer:
      "Yes, when the name is a well-established public alias that can be matched to one person.",
  },
  {
    question: "Can I name the same person twice?",
    answer:
      "No. Every accepted answer is stored by its Wikidata identifier, so alternate spellings of the same person still count only once.",
  },
  {
    question: "When does the timer start?",
    answer:
      "The timer starts only after the server accepts your first correct answer.",
  },
  {
    question: "Do fictional women count?",
    answer:
      "No. The current game accepts real people only.",
  },
];

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: "Name 100 Women",
    url: SITE_URL,
    description:
      "A free timed memory challenge where players try to name 100 real women.",
    applicationCategory: "Game",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    inLanguage: "en",
  };

  return (
    <main>
      <section className="hero">
        <div className="site-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Timed memory challenge</p>
            <h1>Can You Name 100 Women?</h1>
            <p className="hero-lede">
              Type the names of 100 real women. No repeats. The timer starts
              after your first correct answer.
            </p>
            <ul className="hero-points" aria-label="Game highlights">
              <li>No account required</li>
              <li>Real-time name verification</li>
              <li>Shareable result</li>
            </ul>
          </div>
          <Game />
        </div>
      </section>

      <section className="compact-rules" aria-label="Quick rules">
        <div className="site-shell rules-grid">
          <div>
            <span>01</span>
            <strong>Name real women</strong>
            <p>Living or historical people both count.</p>
          </div>
          <div>
            <span>02</span>
            <strong>No repeats</strong>
            <p>Each verified person can score once per game.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Use a full name</strong>
            <p>Add detail when a short name is ambiguous.</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell narrow">
          <p className="eyebrow">How to play</p>
          <h2>A simple challenge with strict verification</h2>
          <div className="steps">
            <article>
              <span>1</span>
              <h3>Enter a name</h3>
              <p>
                Start with any real woman you can remember. The page does not
                provide suggestions or autocomplete.
              </p>
            </article>
            <article>
              <span>2</span>
              <h3>Get a clear result</h3>
              <p>
                Accepted, duplicate, ambiguous and unverified answers receive
                different feedback so you know what to try next.
              </p>
            </article>
            <article>
              <span>3</span>
              <h3>Reach 100</h3>
              <p>
                The challenge finishes automatically at 100 different verified
                people, or you can give up and share your score.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section tinted">
        <div className="site-shell two-column">
          <div>
            <p className="eyebrow">Valid answers</p>
            <h2>What counts as a woman in this game?</h2>
          </div>
          <div className="prose">
            <p>
              A person counts when reliable public data, such as Wikidata or
              Wikipedia, identifies them as a woman. The person must be real,
              uniquely identifiable and represented by at least one Wikipedia
              page.
            </p>
            <p>
              Public stage names, birth names and established aliases can count.
              Fictional characters, organizations and duplicate entries do not.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell two-column">
          <div>
            <p className="eyebrow">Verification</p>
            <h2>How names are checked</h2>
          </div>
          <div className="prose">
            <p>
              The game first checks a local verified database and cache. When a
              name is not known locally, the server uses Wikipedia to identify
              the likely page and Wikidata to confirm the person&apos;s stable
              identifier and public attributes.
            </p>
            <p>
              The browser never decides whether an answer is correct, and it
              does not call Wikipedia or Wikidata directly. Read the full{" "}
              <a href="/how-it-works">technical explanation</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section faq-section">
        <div className="site-shell narrow">
          <p className="eyebrow">Frequently asked questions</p>
          <h2>Questions about the challenge</h2>
          <div className="faq-list">
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section challenge-background">
        <div className="site-shell narrow">
          <p className="eyebrow">The challenge</p>
          <h2>Why try to name 100 women?</h2>
          <p className="lede">
            It is a deceptively difficult memory exercise. The goal is not to
            rank people or define fame; it is to test how quickly you can recall
            women from history, science, sport, politics, culture and everyday
            public life.
          </p>
          <a className="primary-button inline-button" href="#game-heading">
            Start the challenge
          </a>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
    </main>
  );
}
