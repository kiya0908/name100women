import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { trackGameEvent } from "~/shared/analytics.client";
import { GAME_TARGET } from "~/shared/constants";
import { buildShareText, formatDuration } from "~/shared/result";
import type {
  GuessResponse,
  PersonSnapshot,
  SessionSnapshot,
} from "~/shared/types";

interface StartResponse {
  session: SessionSnapshot;
}

interface Feedback {
  status: GuessResponse["status"] | "READY" | "START_ERROR";
  message: string;
}

export function Game() {
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [accepted, setAccepted] = useState<PersonSnapshot[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({
    status: "READY",
    message: "Enter a full name to begin. The timer starts after the first accepted answer.",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  async function startGame() {
    setStarting(true);
    setBusy(false);
    setAccepted([]);
    setInput("");
    setElapsedMs(0);
    setFeedback({
      status: "READY",
      message: "Enter a full name to begin. The timer starts after the first accepted answer.",
    });

    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingPath: window.location.pathname,
          referrer: document.referrer || null,
        }),
      });

      if (!response.ok) {
        throw new Error("START_FAILED");
      }

      const data = (await response.json()) as StartResponse;
      setSession(data.session);
      trackGameEvent("game_session_created");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      setFeedback({
        status: "START_ERROR",
        message: "The game could not be started. Check your connection and try again.",
      });
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    void startGame();
  }, []);

  useEffect(() => {
    if (!session?.startedAt) {
      setElapsedMs(0);
      return;
    }

    if (session.durationMs !== null) {
      setElapsedMs(session.durationMs);
      return;
    }

    const serverOffset = Date.parse(session.serverNow) - Date.now();
    const update = () => {
      setElapsedMs(
        Math.max(
          0,
          Date.now() + serverOffset - Date.parse(session.startedAt as string),
        ),
      );
    };

    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [session?.startedAt, session?.durationMs, session?.serverNow]);

  useEffect(() => {
    const handlePageHide = () => {
      if (
        !session ||
        session.status === "completed" ||
        session.status === "gave_up" ||
        session.status === "abandoned"
      ) {
        return;
      }

      navigator.sendBeacon(
        "/api/game/end",
        new Blob(
          [
            JSON.stringify({
              sessionId: session.id,
              reason: "abandoned",
            }),
          ],
          { type: "application/json" },
        ),
      );
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [session]);

  const gameEnded =
    session?.status === "completed" ||
    session?.status === "gave_up" ||
    session?.status === "abandoned";

  const progressPercent = Math.min(
    100,
    ((session?.correctCount ?? 0) / GAME_TARGET) * 100,
  );

  const shareText = useMemo(() => {
    if (!session) return "";
    return buildShareText(
      session.status,
      session.correctCount,
      session.durationMs ?? elapsedMs,
    );
  }, [session, elapsedMs]);

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = input.trim();
    if (!session || !name || busy || gameEnded) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, name }),
      });
      const data = (await response.json()) as GuessResponse;

      if (data.session) {
        const firstAccepted =
          !session.startedAt &&
          data.status === "ACCEPTED" &&
          Boolean(data.session.startedAt);
        setSession(data.session);
        if (firstAccepted) {
          trackGameEvent("game_started", { progress: 1 });
        }
      }

      if (data.status === "ACCEPTED" && data.person) {
        setAccepted((current) => [...current, data.person as PersonSnapshot]);
        trackGameEvent("guess_accepted", {
          progress: data.session?.correctCount ?? accepted.length + 1,
          completed: data.session?.status === "completed",
        });

        const count = data.session?.correctCount ?? accepted.length + 1;
        if ([10, 25, 50, 75, 100].includes(count)) {
          trackGameEvent("progress_milestone", { progress: count });
        }
        if (data.session?.status === "completed") {
          trackGameEvent("game_completed", {
            progress: count,
            duration_seconds: Math.round((data.session.durationMs ?? 0) / 1_000),
          });
        }
      } else {
        trackGameEvent("guess_rejected", { reason: data.status });
      }

      setFeedback({ status: data.status, message: data.message });
      setInput("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      setFeedback({
        status: "TEMPORARY_ERROR",
        message: "Network error. Your entry was kept so you can retry.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function endGame() {
    if (!session || busy || gameEnded) return;
    setBusy(true);

    try {
      const response = await fetch("/api/game/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, reason: "gave_up" }),
      });
      const data = (await response.json()) as GuessResponse;
      if (data.session) {
        setSession(data.session);
        setElapsedMs(data.session.durationMs ?? elapsedMs);
      }
      setFeedback({ status: data.status, message: data.message });
      trackGameEvent("game_gave_up", {
        progress: data.session?.correctCount ?? session.correctCount,
        duration_seconds: Math.round(
          (data.session?.durationMs ?? elapsedMs) / 1_000,
        ),
      });
    } catch {
      setFeedback({
        status: "TEMPORARY_ERROR",
        message: "The game could not be ended. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!shareText) return;
    await navigator.clipboard.writeText(shareText);
    setFeedback({ status: "READY", message: "Result copied." });
    trackGameEvent("result_copied", {
      progress: session?.correctCount ?? 0,
    });
  }

  async function shareResult() {
    if (!shareText) return;
    if (navigator.share) {
      await navigator.share({
        title: "Name 100 Women",
        text: shareText,
        url: "https://name100women.top",
      });
      trackGameEvent("result_shared", {
        progress: session?.correctCount ?? 0,
      });
      return;
    }
    await copyResult();
  }

  return (
    <section className="game-card" aria-labelledby="game-heading">
      <div className="game-topline">
        <div>
          <p className="game-label">Classic challenge</p>
          <h2 id="game-heading">Your list</h2>
        </div>
        <div className="timer" aria-label={`Elapsed time ${formatDuration(elapsedMs)}`}>
          <span>Time</span>
          <strong>{formatDuration(elapsedMs)}</strong>
        </div>
      </div>

      <div className="progress-block">
        <div className="progress-copy">
          <strong>
            {session?.correctCount ?? 0}
            <span> / {GAME_TARGET}</span>
          </strong>
          <span>{gameEnded ? "Final score" : "women named"}</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={GAME_TARGET}
          aria-valuenow={session?.correctCount ?? 0}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {!gameEnded ? (
        <>
          <form className="guess-form" onSubmit={submitGuess}>
            <label htmlFor="woman-name">Enter a woman&apos;s name</label>
            <div className="input-row">
              <input
                ref={inputRef}
                id="woman-name"
                name="woman-name"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="e.g. Marie Curie"
                autoComplete="off"
                autoCapitalize="words"
                maxLength={100}
                disabled={starting || busy || !session}
                autoFocus
              />
              <button
                className="primary-button"
                type="submit"
                disabled={starting || busy || !session || input.trim().length === 0}
              >
                {busy ? "Checking…" : "Submit"}
              </button>
            </div>
          </form>

          <div
            className={`feedback feedback-${feedback.status.toLowerCase()}`}
            role="status"
            aria-live="polite"
          >
            {starting ? "Preparing a new game…" : feedback.message}
          </div>

          <div className="game-actions">
            {feedback.status === "START_ERROR" ? (
              <button className="secondary-button" type="button" onClick={startGame}>
                Retry start
              </button>
            ) : (
              <button
                className="text-button"
                type="button"
                onClick={endGame}
                disabled={!session || busy}
              >
                Give up and see result
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="result-panel">
          <p className="eyebrow">
            {session?.status === "completed" ? "Challenge completed" : "Game over"}
          </p>
          <h3>
            You named {session?.correctCount ?? 0} of {GAME_TARGET} women
          </h3>
          <p>
            Final time:{" "}
            <strong>
              {formatDuration(session?.durationMs ?? elapsedMs)}
            </strong>
          </p>
          <div className="result-actions">
            <button className="primary-button" type="button" onClick={shareResult}>
              Share result
            </button>
            <button className="secondary-button" type="button" onClick={copyResult}>
              Copy result
            </button>
            <button className="text-button" type="button" onClick={startGame}>
              Play again
            </button>
          </div>
        </div>
      )}

      <div className="accepted-list" aria-live="polite">
        <div className="accepted-heading">
          <h3>Accepted names</h3>
          <span>{accepted.length}</span>
        </div>
        {accepted.length === 0 ? (
          <p className="empty-list">
            Your accepted answers will appear here. No hints are shown.
          </p>
        ) : (
          <ol>
            {accepted.map((person, index) => (
              <li key={`${person.qid}-${index}`}>
                <span className="accepted-number">{index + 1}</span>
                <span>
                  <strong>{person.canonicalName}</strong>
                  {person.description ? <small>{person.description}</small> : null}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
