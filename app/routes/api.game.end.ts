import type { ActionFunctionArgs } from "react-router";

import { cloudflareContext } from "~/context";
import { methodNotAllowed, jsonResponse, readJson } from "~/shared/http";
import { endGameRequestSchema } from "~/shared/schemas";
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
    const parsed = endGameRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonResponse(
        { status: "INVALID_REQUEST", message: "Invalid end-game request." },
        { status: 400 },
      );
    }

    const { env } = context.get(cloudflareContext);
    const result = await new GameService(env).end(
      parsed.data.sessionId,
      parsed.data.reason,
    );

    return jsonResponse(result, {
      status: result.status === "SESSION_NOT_FOUND" ? 404 : 200,
    });
  } catch (error) {
    console.error("Failed to end game", error);
    return jsonResponse(
      {
        status: "TEMPORARY_ERROR",
        message: "The game could not be ended cleanly.",
      },
      { status: 503 },
    );
  }
}
