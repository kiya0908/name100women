import { data, type LoaderFunctionArgs, type MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Page Not Found | Name 100 Women" },
  { name: "robots", content: "noindex, nofollow" },
];

export function loader({ request }: LoaderFunctionArgs) {
  return data(
    { path: new URL(request.url).pathname },
    { status: 404 },
  );
}

export default function NotFoundPage() {
  return (
    <main className="site-shell error-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <a className="primary-button inline-button" href="/">
        Play Name 100 Women
      </a>
    </main>
  );
}
