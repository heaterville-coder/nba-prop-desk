# NBA Prop Desk

Player prop projections, ladders, target prices and paper-trade tracking for NBA games, with a live injury report.

- `index.html` — the whole app (one page).
- `netlify/functions/injuries.mjs` — a small helper Netlify runs on request. It fetches the current NBA injury report and serves it at `/api/injuries`.
- `netlify.toml` — tells Netlify to publish this folder and where the helper lives. No build step.

The injury source is ESPN's public data, which is unofficial and can change. Swap it for a licensed feed before launch.
