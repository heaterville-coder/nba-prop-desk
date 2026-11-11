// One player's game-by-game log for a season, from ESPN's public data.
// Unofficial source: swap for a licensed feed before launch.
const BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes";

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
function grab(names, stats, re, part) {
  const i = names.findIndex((n) => re.test(n));
  if (i < 0) return null;
  const raw = String(stats[i] ?? "");
  if (part !== undefined) return num(raw.split("-")[part]);
  return num(raw);
}

export function parse(json) {
  const names = json?.names || json?.labels || [];
  const evmeta = json?.events || {};
  const games = [];
  for (const st of json?.seasonTypes ?? []) {
    const label = `${st.displayName || ""} ${st.name || ""}`;
    if (/pre|post|play-?in|playoff/i.test(label) && !/regular/i.test(label)) continue;
    for (const cat of st.categories ?? []) {
      for (const e of cat.events ?? []) {
        const s = e.stats || [];
        const m = evmeta[e.eventId] || {};
        const opp = m.opponent?.abbreviation || m.opponent?.displayName || "";
        const date = m.gameDate || m.date || "";
        if (!date) continue;
        const atVs = (m.atVs || "").trim();
        games.push({
          id: e.eventId, date, opp, home: atVs ? atVs !== "@" : null,
          result: m.gameResult || "",
          min: grab(names, s, /^minutes$/i),
          pts: grab(names, s, /^points$/i),
          reb: grab(names, s, /^(totalRebounds|rebounds)$/i),
          ast: grab(names, s, /^assists$/i),
          tpm: grab(names, s, /^threePointFieldGoalsMade/i, 0),
          fga: grab(names, s, /^fieldGoalsMade-fieldGoalsAttempted$/i, 1),
        });
      }
    }
  }
  const seen = new Set();
  return games.filter((g) => (seen.has(g.id) ? false : seen.add(g.id))).sort((a, b) => a.date.localeCompare(b.date));
}

export default async (req) => {
  const u = new URL(req.url);
  const id = (u.searchParams.get("id") || "").replace(/\D/g, "");
  const season = (u.searchParams.get("season") || "").replace(/\D/g, "");
  if (!id) return new Response(JSON.stringify({ error: "Missing player id" }), { status: 400, headers: { "content-type": "application/json" } });
  try {
    const res = await fetch(`${BASE}/${id}/gamelog${season ? `?season=${season}` : ""}`, { headers: { "user-agent": "Mozilla/5.0 (PropDesk)" } });
    if (!res.ok) throw new Error(`Game log source answered ${res.status}`);
    const json = await res.json();
    const games = parse(json);
    const body = { id, season, games };
    if (u.searchParams.has("debug")) body.debug = { names: json?.names, labels: json?.labels, seasonTypes: (json?.seasonTypes || []).map((s) => s.displayName), sampleEvent: Object.values(json?.events || {})[0] };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
};

export const config = { path: "/api/gamelog" };
