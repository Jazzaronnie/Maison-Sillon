import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import XLSX from "xlsx";

const source = process.argv[2];
const destination = process.argv[3] || "data/inventory.sql";
if (!source) throw new Error("Usage: npm run import:inventory -- /absolute/path/CDs_Verified_Prices.xlsx");

const book = XLSX.readFile(source, { cellDates: true });
const sheet = book.Sheets.CDs || book.Sheets[book.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
const clean = value => String(value ?? "").trim();
const quote = value => `'${String(value ?? "").replaceAll("'", "''")}'`;
const number = value => Number(value) || 0;

function categoryFor(row) {
  const text = `${row.Artist} ${row.Title} ${row.Label} ${row.Format}`.toLowerCase();
  if (/bach|beethoven|mozart|vivaldi|pachelbel|opera|symphon|classical|requiem|piano concerto/.test(text)) return "Classical";
  if (/krall|bublé|jazz|blues|thorogood/.test(text)) return "Jazz & Blues";
  if (/country|alabama|celtic|folk|irish|ceilidh/.test(text)) return "Folk & Country";
  if (/ambient|relaxation|natural dreams|solitudes/.test(text)) return "Ambient";
  return "Rock & Pop";
}

// Exact duplicate copies are grouped. Different condition/price variants stay distinct.
const groups = new Map();
for (const row of rows) {
  const releaseId = clean(row.release_id).replace(/\.0$/, "");
  if (!releaseId || !clean(row.Artist) || !clean(row.Title)) continue;
  const price = number(row["Verified CAD"] || row["FINAL PRICE CHECK"] || row.Price);
  const key = [releaseId, clean(row["Collection Media Condition"]), clean(row["Collection Sleeve Condition"]), price].join("|");
  const existing = groups.get(key);
  if (existing) existing.quantity += 1;
  else groups.set(key, { row, releaseId, price, quantity: 1, key });
}

const statements = ["DELETE FROM releases;"];
for (const { row, releaseId, price, quantity, key } of groups.values()) {
  // The digest makes variants of the same Discogs release (condition/price) distinct.
  const listingKey = `${releaseId}-${crypto.createHash("sha256").update(key).digest("base64url").slice(0, 12)}`;
  statements.push(`INSERT INTO releases (listing_key, release_id, artist, title, label_name, format, release_year, media_condition, sleeve_condition, notes, price_cad, quantity, status, category) VALUES (${quote(listingKey)}, ${quote(releaseId)}, ${quote(clean(row.Artist))}, ${quote(clean(row.Title))}, ${quote(clean(row.Label))}, ${quote(clean(row.Format))}, ${number(row.Released) || "NULL"}, ${quote(clean(row["Collection Media Condition"]))}, ${quote(clean(row["Collection Sleeve Condition"]))}, ${quote(clean(row["Collection Notes"]))}, ${price}, ${quantity}, 'available', ${quote(categoryFor(row))});`);
}
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${statements.join("\n")}\n`);
console.log(`Created ${destination} with ${groups.size} grouped listings from ${rows.length} source rows.`);
