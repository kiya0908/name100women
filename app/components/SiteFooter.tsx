import { Link } from "react-router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <p>© {new Date().getFullYear()} Name 100 Women</p>
        <nav aria-label="Footer navigation">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
