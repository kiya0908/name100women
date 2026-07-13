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
  {
    question: "Is the Name 100 Women game free?",
    answer:
      "Yes. The game is free to play in your browser, and you do not need to create an account or provide your own name before starting.",
  },
  {
    question: "Can women from any country or time period count?",
    answer:
      "Yes. The challenge can include living or historical women from any country, profession or period when they meet the same public-data rules.",
  },
  {
    question: "What should I do if a valid name is not accepted?",
    answer:
      "Try the person's fuller public name first. If the result is still unexpected, use the contact page to report the entered name, expected person and a relevant Wikipedia or Wikidata link.",
  },
  {
    question: "Does refreshing the page keep my game?",
    answer:
      "No. Refreshing starts a new game session. Finish, give up or copy your result before reloading if you want to keep the score from the current attempt.",
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
              Take the Name 100 Women challenge by typing 100 real women from
              memory. No repeats. The timer starts after your first correct
              answer.
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
          <h2>How to play Name 100 Women</h2>
          <p className="lede">
            Name 100 Women is deliberately easy to start and difficult to
            finish. You need only a browser, a keyboard and whatever names you
            can recall. There are no multiple-choice clues and no account wall
            between you and the game.
          </p>
          <div className="steps">
            <article>
              <span>1</span>
              <h3>Enter a name</h3>
              <p>
                Start the Name 100 Women game with any real woman you can
                remember. The page does not provide suggestions or
                autocomplete, so every answer comes from your own memory.
              </p>
            </article>
            <article>
              <span>2</span>
              <h3>Get a clear result</h3>
              <p>
                Submit with Enter or the button. The game separates
                accepted, duplicate, ambiguous and unverified answers so you
                know whether to continue, add a fuller name or retry later.
              </p>
            </article>
            <article>
              <span>3</span>
              <h3>Reach 100</h3>
              <p>
                Keep going until the Name 100 Women challenge accepts 100
                different people. It ends automatically at the target, or you
                can give up, review your total and copy a shareable result.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section tinted">
        <div className="site-shell answer-guide">
          <div className="answer-guide__intro">
            <p className="eyebrow">Valid answers</p>
            <h2>What counts as a woman in this game?</h2>
            <p className="lede">
              A person counts when reliable public data, such as Wikidata or
              Wikipedia, identifies them as a woman. The person must be real,
              uniquely identifiable and represented by at least one Wikipedia
              page.
            </p>
            <p className="answer-guide__note">
              Name 100 Women applies the same public-data rule across countries,
              professions and historical periods. Fame is not part of the test.
            </p>
          </div>
          <div className="answer-rules" role="list">
            <article className="answer-rule answer-rule--yes" role="listitem">
              <span>Counts</span>
              <h3>Real and publicly documented</h3>
              <p>
                Living and historical women are both eligible when one public
                record clearly identifies the person and a Wikipedia page
                exists. The rule applies equally to people from different
                countries, periods and professions, without a separate fame
                threshold.
              </p>
            </article>
            <article className="answer-rule answer-rule--yes" role="listitem">
              <span>Counts</span>
              <h3>Established public names</h3>
              <p>
                Birth names, stage names and reliable public aliases can count
                when they resolve to one person rather than several possible
                people. A familiar public name does not have to match the page
                title word for word when the identity is still clear.
              </p>
            </article>
            <article className="answer-rule answer-rule--maybe" role="listitem">
              <span>Try again</span>
              <h3>Short or shared names</h3>
              <p>
                An ambiguous answer needs a fuller public name. The game will
                not reveal a candidate list because suggestions would give away
                possible answers. Adding a surname or using the fuller form from
                a public record usually gives the server a more precise entry to
                check.
              </p>
            </article>
            <article className="answer-rule answer-rule--no" role="listitem">
              <span>Does not count</span>
              <h3>Fictional, non-person or repeated</h3>
              <p>
                Characters, organizations and places are excluded. Alternate
                spellings of an accepted woman share one Wikidata identifier,
                so the same person scores only once. Failed and duplicate
                attempts receive their own feedback and never increase the
                accepted total.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section strategy-section">
        <div className="site-shell">
          <header className="strategy-header">
            <div>
              <p className="eyebrow">Memory strategy</p>
              <h2>Build your Name 100 Women list from broad categories</h2>
            </div>
            <p className="lede">
              Recalling 100 people is easier when you search memory in groups.
              Categories are prompts, not game restrictions or bonus rounds.
            </p>
          </header>
          <div className="category-rail" aria-label="Suggested memory categories">
            <span>Music</span>
            <span>History</span>
            <span>Science</span>
            <span>Sport</span>
            <span>Politics</span>
            <span>Literature</span>
            <span>Film &amp; TV</span>
            <span>Business</span>
          </div>
          <ol className="strategy-steps">
            <li>
              <span aria-hidden="true">01</span>
              <div>
                <h3>Start where recall is easiest</h3>
                <p>
                  Begin with the subjects, playlists, teams, books and news you
                  already follow. Familiar areas create momentum before the
                  timer makes a blank moment feel urgent. The Name 100 Women
                  timer waits for your first accepted answer, so you can choose
                  that starting point without losing time.
                </p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <div>
                <h3>Follow one cluster at a time</h3>
                <p>
                  Within a field, move across countries, decades, roles or
                  events. Name 100 Women accepts any real woman who satisfies
                  the same verification rules; the category only organizes your
                  thinking. Once one cluster slows down, a related field or an
                  earlier decade can provide the next useful prompt.
                </p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <div>
                <h3>Switch lanes when you stall</h3>
                <p>
                  Move from recent culture to history or from entertainment to
                  science and sport. Returning later often unlocks another group
                  of names faster than chasing one stubborn answer. Consistent
                  progress matters more than solving every uncertain entry in
                  the order it first appears.
                </p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">04</span>
              <div>
                <h3>Use the clearest public name</h3>
                <p>
                  Full names reduce ambiguity, while established stage names may
                  also work. Private people without qualifying public records
                  are unlikely to be verified, and the game never asks for your
                  own name. If a valid public figure is still not recognized,
                  keep the entry and report the unexpected result after the
                  attempt.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="content-section tinted">
        <div className="site-shell verification-panel">
          <header className="verification-header">
            <div>
              <p className="eyebrow">Verification</p>
              <h2>How Name 100 Women checks an answer</h2>
            </div>
            <p>
              The browser sends a name; the server follows an explicit,
              rule-based path before returning a result.
            </p>
          </header>
          <ol className="verification-flow">
            <li>
              <span>01</span>
              <h3>Check local records</h3>
              <p>
                Verified aliases, manual corrections, the fast cache and stored
                database records are checked first. A local match avoids an
                unnecessary external request.
              </p>
            </li>
            <li>
              <span>02</span>
              <h3>Identify the person</h3>
              <p>
                When needed, Wikipedia finds the likely page or redirect and
                Wikidata confirms a stable identifier, person type, public
                attributes and Wikipedia coverage.
              </p>
            </li>
            <li>
              <span>03</span>
              <h3>Return one clear status</h3>
              <p>
                The identifier is checked against accepted answers before the
                server returns accepted, duplicate, ambiguous, invalid or a
                retryable temporary error.
              </p>
            </li>
          </ol>
          <aside className="verification-note">
            <div>
              <strong>The server stays authoritative.</strong>
              <p>
                It decides correctness, progress and official elapsed time. A
                third-party timeout is never treated as proof that a woman does
                not count, and a language model is not the real-time judge.
              </p>
            </div>
            <p>
              Read the <a href="/how-it-works">full verification process</a> or{" "}
              <a href="/contact">report an unexpected result</a>. The{" "}
              <a href="/privacy">privacy policy</a> explains how Name 100 Women
              handles submitted names and analytics.
            </p>
          </aside>
        </div>
      </section>

      <section className="content-section faq-section">
        <div className="site-shell narrow">
          <p className="eyebrow">Frequently asked questions</p>
          <h2>Name 100 Women questions and answers</h2>
          <p className="lede">
            These answers cover the rules players most often need before or
            during a Name 100 Women attempt. They describe the current real-women
            MVP rather than future game modes.
          </p>
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

      <section className="challenge-cta">
        <div className="site-shell challenge-cta__inner">
          <div>
            <p className="eyebrow">Your turn</p>
            <h2>Why try to name 100 women?</h2>
            <p>See how many real women you can recall before memory runs dry.</p>
          </div>
          <a className="primary-button challenge-cta__button" href="#game-heading">
            Play now <span aria-hidden="true">↑</span>
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
