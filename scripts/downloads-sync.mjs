/**
 * Repoints site_downloads at the Google Drive copies of the software archives,
 * fixes two titles, and adds the missing Debug Tool row.
 *
 * Dry run (prints the current rows and the planned changes, writes nothing):
 *   node scripts/downloads-sync.mjs
 *
 * Apply (needs the two SQL row ids from the dry run — see the note below):
 *   node scripts/downloads-sync.mjs --apply --sql-engine=<id> --sql-studio=<id>
 *
 * Requires DATABASE_URL in the environment:
 *   vercel env pull .env.local     # then: node --env-file=.env.local scripts/downloads-sync.mjs
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first,");
  console.error("then `node --env-file=.env.local scripts/downloads-sync.mjs`.");
  process.exit(1);
}
const sql = neon(url);

const VIEW = (id) => `https://drive.google.com/file/d/${id}/view?usp=drive_link`;

// Keyed by a unique fragment of the row's CURRENT Blob file_url, which is the
// only reliable identifier — two rows share the title "SQL Server".
const BY_URL_FRAGMENT = [
  { frag: "e-time-track-lite-1791289636446", title: "eTimeTrackLite Desktop", size: "69.9 MB", driveId: "1spqYJ1FZ3CkCYqtYA230I_2Q9IXWjkws" },
  { frag: "e-time-track-lite-web-1791289707045", title: "eTimeTrackLite Web", size: "42.6 MB", driveId: "1_VgUvuLEog2vUZZWXyl2KIPifrXtM3_S" },
  { frag: "smart-office-desktop-1780630552349", title: "Smart Office Desktop", size: "47.0 MB", driveId: "1SFniwk05oV-TfaG289xERRv1QhydE-zq" },
  { frag: "smart-office-web-1780630657140", title: "Smart Office Web", size: "273.2 MB", driveId: "1NsY1T73if-mkxXsRGIympVM8_161hocl" },
  { frag: "ebio-server-1780630761598", title: "eBio Server", size: "13.2 MB", driveId: "118fK8llz-xi2mhvpTI_HQZs1WiRjuZl4" },
  { frag: "device-management-tool-1780595166486", title: "Device Management Tool", size: "1.2 MB", driveId: "1OgTKMESd4fvlrqKGTOGQUAhRNK-ud5mK" },
];

// The two "SQL Server" rows cannot be told apart from the data — both titles are
// identical and both blobs are named sql-server-<timestamp>. Which is the engine
// and which is the management studio has to come from you, by id.
const SQL_ENGINE = { title: "SQL Server Express Edition", size: "4.4 MB", driveId: "1kJ_7TMIofhoaaYELSzAdDURFml0L37yB" };
const SQL_STUDIO = { title: "SQL Management Studio Express Edition", size: "5.4 MB", driveId: "1gI1HEWdxBcH7Sj-rRPqXbsOHBTL1atM4" };

const DEBUG_TOOL = {
  title: "Debug Tool",
  description: "Diagnostic utility for biometric and access control devices",
  size: "17.8 MB",
  driveId: "1U5ydBw_-YI7f8lCWrDlTSn-6aL5FWE3b",
};

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const argVal = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : null;
};

const rows = await sql.query(
  "SELECT id, title, file_url, file_type, file_size, category, display_order FROM site_downloads ORDER BY display_order, id",
);

console.log(`\nCurrent site_downloads rows (${rows.length}):\n`);
for (const r of rows) {
  const tail = r.file_url.length > 54 ? "…" + r.file_url.slice(-52) : r.file_url;
  console.log(`  id=${String(r.id).padEnd(4)} order=${String(r.display_order).padEnd(3)} ${r.title.padEnd(26)} ${tail}`);
}

const plan = [];
for (const m of BY_URL_FRAGMENT) {
  const row = rows.find((r) => r.file_url.includes(m.frag));
  if (!row) {
    console.log(`\n  !! no row matches fragment "${m.frag}" — skipped`);
    continue;
  }
  plan.push({ id: row.id, from: row.title, ...m });
}

const engineId = argVal("sql-engine");
const studioId = argVal("sql-studio");
const sqlRows = rows.filter((r) => r.file_url.includes("sql-server-"));

console.log(`\nThe two SQL rows (you must map these yourself):\n`);
for (const r of sqlRows) console.log(`  id=${r.id}  order=${r.display_order}  ${r.file_url.slice(-46)}`);

if (engineId) plan.push({ id: engineId, from: "SQL Server", ...SQL_ENGINE });
if (studioId) plan.push({ id: studioId, from: "SQL Server", ...SQL_STUDIO });

console.log(`\nPlanned updates (${plan.length}):\n`);
for (const p of plan) {
  const rename = p.from !== p.title ? `  [title: "${p.from}" -> "${p.title}"]` : "";
  console.log(`  id=${String(p.id).padEnd(4)} ${p.title.padEnd(38)} ${p.size.padStart(9)}${rename}`);
}

const hasDebug = rows.some((r) => r.title.trim().toLowerCase() === "debug tool");
console.log(hasDebug ? `\n  Debug Tool row already exists — no insert.` : `\n  Will INSERT a new "Debug Tool" row.`);

if (!apply) {
  console.log(`\nDry run — nothing written. Re-run with:`);
  console.log(`  node scripts/downloads-sync.mjs --apply --sql-engine=<id> --sql-studio=<id>\n`);
  process.exit(0);
}

if (!engineId || !studioId) {
  console.error(`\n--apply requires both --sql-engine=<id> and --sql-studio=<id>.`);
  console.error(`Pick them from the two SQL rows listed above.\n`);
  process.exit(1);
}
if (engineId === studioId) {
  console.error(`\n--sql-engine and --sql-studio must be different ids.\n`);
  process.exit(1);
}

let updated = 0;
for (const p of plan) {
  await sql`
    UPDATE site_downloads
       SET file_url = ${VIEW(p.driveId)},
           title = ${p.title},
           file_size = ${p.size},
           file_type = 'zip'
     WHERE id = ${p.id}
  `;
  updated++;
}

let inserted = 0;
if (!hasDebug) {
  const maxOrder = rows.reduce((m, r) => Math.max(m, r.display_order ?? 0), 0);
  const category = rows.find((r) => r.title === "Device Management Tool")?.category ?? "Software";
  await sql`
    INSERT INTO site_downloads (title, description, file_url, file_type, file_size, category, display_order)
    VALUES (${DEBUG_TOOL.title}, ${DEBUG_TOOL.description}, ${VIEW(DEBUG_TOOL.driveId)},
            'zip', ${DEBUG_TOOL.size}, ${category}, ${maxOrder + 1})
  `;
  inserted = 1;
}

console.log(`\nDone: ${updated} rows updated, ${inserted} inserted.`);
console.log(`Redeploy or wait for revalidation, then check https://syncbyte.in/downloads\n`);
