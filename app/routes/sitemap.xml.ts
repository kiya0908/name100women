import type { LoaderFunctionArgs } from "react-router";

import { SITE_URL } from "~/shared/constants";

const paths = ["", "/how-it-works", "/privacy", "/terms", "/contact"];

export function loader({ request }: LoaderFunctionArgs): Response {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const lastmod = "2026-07-13";
  const urls = paths
    .map(
      (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
