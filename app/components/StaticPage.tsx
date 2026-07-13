import type { ReactNode } from "react";

interface StaticPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function StaticPage({
  eyebrow,
  title,
  intro,
  children,
}: StaticPageProps) {
  return (
    <main className="site-shell static-page">
      <header className="static-page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
      </header>
      <article className="prose">{children}</article>
    </main>
  );
}
