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
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";

import "./app.css";

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

function AnalyticsScripts({
  ga4Id,
  clarityId,
}: {
  ga4Id: string | null;
  clarityId: string | null;
}) {
  return (
    <>
      {ga4Id ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              ga4Id,
            )}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(
                ga4Id,
              )},{anonymize_ip:true});`,
            }}
          />
        </>
      ) : null}
      {clarityId ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(
              clarityId,
            )});`,
          }}
        />
      ) : null}
    </>
  );
}
