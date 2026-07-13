import type { ActionFunctionArgs } from "react-router";

import { cloudflareContext } from "~/context";
import { methodNotAllowed, jsonResponse, readJson } from "~/shared/http";
import { guessRequestSchema } from "~/shared/schemas";
import type { GuessStatus } from "~/shared/types";
import { GameService } from "~/server/services/game.service";

export function loader(): Response {
  return methodNotAllowed();
}

export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const parsed = guessRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonResponse(
        { status: "INVALID_REQUEST", message: "Enter a valid name." },
        { status: 400 },
      );
    }

    const { env } = context.get(cloudflareContext);
    const result = await new GameService(env).guess(
      parsed.data.sessionId,
      parsed.data.name,
    );

    return jsonResponse(result, {
      status: httpStatusForGuess(result.status),
    });
  } catch (error) {
    console.error("Guess request failed", error);
    return jsonResponse(
      {
        status: "TEMPORARY_ERROR",
        message: "The verification service is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}

function httpStatusForGuess(status: GuessStatus): number {
  switch (status) {
    case "INVALID_REQUEST":
      return 400;
    case "SESSION_NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "TEMPORARY_ERROR":
      return 503;
    case "GAME_FINISHED":
      return 409;
    default:
      return 200;
  }
}
