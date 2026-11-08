// Upcoming NBA games with tip time, spread and total, from ESPN's public scoreboard.
// Unofficial source: swap for a licensed feed before launch.
const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");

export function parse(json) {
  const games = [];
  for (const ev of json?.events ?? []) {
    const comp = ev.competitions?.[0] ?? {};
    const teams = comp.competitors ?? [];
    const home = teams.find((t) => t.homeAway === "home")?.team?.abbreviation;
    const away = teams.find((t) => t.homeAway === "away")?.team?.abbreviation;
    if (!home || !away) continue;
    const odds = comp.odds?.[0] ?? {};
    let spreadHome = null;
    const m = /^([A-Z]{2,4})\s+([-+]?\d+(?:\.\d+)?)$/.exec((odds.details || "").trim());
    if (m) { const n = Math.abs(Number(m[2])); spreadHome = m[1] === home ? -n : m[1] === away ? n : null; }
    else if (/^even|pk$/i.test((odds.details || "").trim())) spreadHome = 0;
    games.push({
      start: ev.date || comp.date || "",
      away, home,
      total: Number.isFinite(Number(odds.overUnder)) ? Number(odds.overUnder) : null,
      spreadHome,
      status: ev.status?.type?.state || "",
    });
  }
  return games;
}

export default async () => {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 12 * 3600e3);
    const end = new Date(now.getTime() + 13 * 86400e3);
    const res = await fetch(`${BASE}?dates=${ymd(start)}-${ymd(end)}&limit=300`, { headers: { "user-agent": "Mozilla/5.0 (PropDesk)" } });
    if (!res.ok) throw new Error(`Schedule source answered ${res.status}`);
    const games = parse(await res.json());
    return new Response(JSON.stringify({ updated: new Date().toISOString(), games }), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 502, headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};

export const config = { path: "/api/schedule" };
