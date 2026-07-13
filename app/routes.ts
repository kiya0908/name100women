import {
  index,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("how-it-works", "routes/how-it-works.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("contact", "routes/contact.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("robots.txt", "routes/robots.txt.ts"),
  route("api/game/start", "routes/api.game.start.ts"),
  route("api/game/guess", "routes/api.game.guess.ts"),
  route("api/game/end", "routes/api.game.end.ts"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
