// Fetches the current NBA injury report and returns a small, clean list for the Prop Desk page.
// Source: ESPN's public injuries data (unofficial; swap for a licensed feed before launch).
const SOURCE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries";

export function simplify(json) {
  const items = [];
  for (const team of json?.injuries ?? []) {
    for (const i of team?.injuries ?? []) {
      const a = i?.athlete ?? {};
      const d = i?.details ?? {};
      const side = d.side && d.side !== "Not Specified" ? d.side : "";
      items.push({
        team: team.displayName || a.team?.displayName || "",
        abbr: a.team?.abbreviation || "",
        player: a.displayName || [a.firstName, a.lastName].filter(Boolean).join(" "),
        status: i.status || i.type?.description || "",
        injury: [side, d.type, d.detail].filter(Boolean).join(" "),
        comment: i.shortComment || "",
        date: i.date || "",
        returns: d.returnDate || "",
      });
    }
  }
  return { updated: json?.timestamp || new Date().toISOString(), fetched: new Date().toISOString(), items };
}

export default async () => {
  try {
    const res = await fetch(SOURCE, { headers: { "user-agent": "Mozilla/5.0 (PropDesk)" } });
    if (!res.ok) throw new Error(`Injury source answered ${res.status}`);
    const body = simplify(await res.json());
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};

export const config = { path: "/api/injuries" };
