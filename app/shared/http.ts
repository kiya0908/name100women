export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function methodNotAllowed(allowed = "POST"): Response {
  return jsonResponse(
    { status: "INVALID_REQUEST", message: "Method not allowed." },
    { status: 405, headers: { Allow: allowed } },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("INVALID_CONTENT_TYPE");
  }
  return request.json();
}
