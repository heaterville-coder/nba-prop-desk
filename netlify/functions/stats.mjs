// Season-to-date per-game stats for every NBA player, from ESPN's public stats data.
// Unofficial source: swap for a licensed feed before launch.
const BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete";
const PARAMS = "region=us&lang=en&contentorigin=espn&isqualified=false&sort=general.avgMinutes:desc&limit=200";

const WANT = {
  G: /^gamesPlayed$/i, GS: /^gamesStarted$/i, MP: /^avgMinutes$/i,
  FGA: /^avgFieldGoalsAttempted$/i, TPA: /^avgThreePointFieldGoalsAttempted$/i, FTA: /^avgFreeThrowsAttempted$/i,
  PTS: /^avgPoints$/i, REB: /^avgRebounds$/i, AST: /^avgAssists$/i, TPM: /^avgThreePointFieldGoalsMade$/i,
};

export function parse(json) {
  const cats = json?.categories ?? [];
  const names = {}; // category name -> list of stat keys
  for (const c of cats) names[c.name] = c.names || c.keys || [];
  const rows = [];
  for (const a of json?.athletes ?? []) {
    const ath = a.athlete ?? {};
    const vals = {};
    for (const c of a.categories ?? []) {
      const keys = names[c.name] || c.names || [];
      const v = c.values || c.totals || [];
      keys.forEach((k, i) => { const n = Number(v[i]); if (Number.isFinite(n)) vals[k] = n; });
    }
    const pick = {};
    for (const [out, re] of Object.entries(WANT)) {
      const k = Object.keys(vals).find((x) => re.test(x));
      pick[out] = k === undefined ? null : vals[k];
    }
    const abbr = ath.teamShortName || ath.team?.abbreviation || ath.teams?.[0]?.abbreviation || "";
    if (!ath.displayName || !abbr || !pick.G || pick.MP == null) continue;
    rows.push([ath.displayName, abbr, ath.position?.abbreviation || "", pick.G, pick.GS, pick.MP, pick.FGA, pick.TPA, pick.FTA, pick.PTS, pick.REB, pick.AST, pick.TPM]);
  }
  return { rows, pages: json?.pagination?.pages || 1, sampleKeys: Object.keys(names).length ? names : null };
}

export default async (req) => {
  const debug = new URL(req.url).searchParams.has("debug");
  try {
    let page = 1, pages = 1, rows = [], first = null;
    do {
      const res = await fetch(`${BASE}?${PARAMS}&page=${page}`, { headers: { "user-agent": "Mozilla/5.0 (PropDesk)" } });
      if (!res.ok) throw new Error(`Stats source answered ${res.status}`);
      const json = await res.json();
      if (!first) first = json;
      const p = parse(json);
      rows = rows.concat(p.rows);
      pages = Math.min(p.pages, 5);
      page++;
    } while (page <= pages);
    const body = { updated: new Date().toISOString(), count: rows.length, players: rows };
    if (debug) body.debug = { categories: (first?.categories || []).map((c) => ({ name: c.name, names: c.names })), firstAthlete: first?.athletes?.[0] };
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=900" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 502, headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};

export const config = { path: "/api/stats" };
