import type { ActionFunctionArgs } from "react-router";

import { cloudflareContext } from "~/context";
import { methodNotAllowed, jsonResponse, readJson } from "~/shared/http";
import { startGameRequestSchema } from "~/shared/schemas";
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
    const parsed = startGameRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonResponse(
        { status: "INVALID_REQUEST", message: "Invalid game start request." },
        { status: 400 },
      );
    }

    const { env } = context.get(cloudflareContext);
    const result = await new GameService(env).start(request, parsed.data);
    const headers = new Headers();
    if (result.setCookie) {
      headers.append("Set-Cookie", result.setCookie);
    }

    return jsonResponse(result.body, { status: 201, headers });
  } catch (error) {
    console.error("Failed to start game", error);
    return jsonResponse(
      {
        status: "TEMPORARY_ERROR",
        message: "The game could not be started. Try again.",
      },
      { status: 503 },
    );
  }
}
