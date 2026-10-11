import fs from "node:fs/promises";
import XLSX from "xlsx";

const source = process.argv[2];
const destination = process.argv[3] || "data/discogs-enrichment.sql";
const token = process.env.DISCOGS_TOKEN;
if (!source) throw new Error("Usage: DISCOGS_TOKEN=... npm run enrich:discogs -- /absolute/path/CDs_Verified_Prices.xlsx");
if (!token) throw new Error("DISCOGS_TOKEN is required. Use a newly generated token and never commit it.");

const quote = value => `'${String(value ?? "").replaceAll("'", "''")}'`;
const book = XLSX.readFile(source);
const sheet = book.Sheets.CDs || book.Sheets[book.SheetNames[0]];
const ids = [...new Set(XLSX.utils.sheet_to_json(sheet, { defval:"" }).map(row => String(row.release_id || "").replace(/\.0$/, "").trim()).filter(Boolean))];
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function categoryFor(data) {
  const labels = [...(data.genres || []), ...(data.styles || [])].join(" ").toLowerCase();
  if (/classical|opera|romantic|baroque/.test(labels)) return "Classical";
  if (/jazz|blues|swing|soul/.test(labels)) return "Jazz & Blues";
  if (/folk|country|bluegrass|celtic/.test(labels)) return "Folk & Country";
  if (/ambient|new age|meditation/.test(labels)) return "Ambient";
  if (/world|latin|reggae|african/.test(labels)) return "World";
  return "Rock & Pop";
}

const statements = ["-- Generated from Discogs API. Review cover licensing and missing images before launch."];
for (let index = 0; index < ids.length; index += 1) {
  const id = ids[index];
  try {
    const response = await fetch(`https://api.discogs.com/releases/${encodeURIComponent(id)}`, {
      headers: { "Authorization": `Discogs token=${token}`, "User-Agent":"MaisonSillonInventory/1.0 + https://maison-sillon.pages.dev" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const image = data.images?.find(imageItem => imageItem.type === "primary")?.uri || data.images?.[0]?.uri || "";
    const popularity = Number(data.community?.rating?.count) || 0;
    statements.push(`UPDATE releases SET discogs_image_url = ${quote(image)}, category = ${quote(categoryFor(data))}, popularity_score = ${popularity}, updated_at = CURRENT_TIMESTAMP WHERE release_id = ${quote(id)};`);
    console.log(`${index + 1}/${ids.length}: ${id}`);
  } catch (error) {
    console.warn(`${index + 1}/${ids.length}: ${id} skipped (${error.message})`);
  }
  // Discogs permits 60 authenticated requests per minute; stay below that limit.
  await delay(1050);
}
await fs.writeFile(destination, `${statements.join("\n")}\n`);
console.log(`Created ${destination}. Apply it to D1 only after checking the output.`);
