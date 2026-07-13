import { Link, NavLink } from "react-router";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand" to="/" aria-label="Name 100 Women home">
          <img
            className="brand-mark"
            src="/android-chrome-192x192.png"
            alt=""
            width="38"
            height="38"
          />
          <span>Name 100 Women</span>
        </Link>
        <nav aria-label="Primary navigation">
          <NavLink to="/" end>
            Play
          </NavLink>
          <NavLink to="/how-it-works">How it works</NavLink>
        </nav>
      </div>
    </header>
  );
}
