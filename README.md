# NBA Prop Desk

Player prop projections, ladders, target prices and paper-trade tracking for NBA games, with a live injury report.

- `index.html` — the whole app (one page).
- `netlify/functions/injuries.mjs` — live NBA injury report at `/api/injuries`.
- `netlify/functions/stats.mjs` — season-to-date per-game stats for every player at `/api/stats` (add `?debug=1` to see the raw source fields).
- `netlify/functions/schedule.mjs` — next two weeks of games with tip time, spread and total at `/api/schedule`.
- `netlify.toml` — tells Netlify to publish this folder and where the helper lives. No build step.

All three sources are ESPN's public data, which is unofficial and can change. Swap it for a licensed feed before launch.
