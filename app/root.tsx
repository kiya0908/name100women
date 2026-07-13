import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";

import "./app.css";

import { AnalyticsScripts } from "./components/AnalyticsScripts";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { cloudflareContext } from "./context";

export const meta: MetaFunction = () => [
  { title: "Name 100 Women" },
  {
    name: "description",
    content:
      "Can you name 100 real women? Play the free timed memory challenge with no sign-up.",
  },
];

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.ico",
    sizes: "any",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple-touch-icon.png",
  },
  {
    rel: "manifest",
    href: "/site.webmanifest",
  },
];

export function loader({ context }: LoaderFunctionArgs) {
  const { env } = context.get(cloudflareContext);
  return {
    ga4Id: env.GA4_ID ?? null,
    clarityId: env.CLARITY_ID ?? null,
  };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fff8f4" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ga4Id, clarityId } = useLoaderData<typeof loader>();

  return (
    <>
      <AnalyticsScripts ga4Id={ga4Id} clarityId={clarityId} />
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <>
      <SiteHeader />
      <main className="site-shell error-page">
        <p className="eyebrow">{notFound ? "404" : "Unexpected error"}</p>
        <h1>{notFound ? "Page not found" : "Something went wrong"}</h1>
        <p>
          {notFound
            ? "The page you requested does not exist."
            : "The page could not be loaded. Please return to the game and try again."}
        </p>
        <a className="primary-button inline-button" href="/">
          Back to the game
        </a>
      </main>
      <SiteFooter />
    </>
  );
}
