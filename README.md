# Maison Sillon

Maison Sillon is a bilingual, mobile-first catalogue for a curated CD collection in Montréal. It combines an immersive room entrance with a searchable complete catalogue, inventory quantities, a shipping/pickup basket and a private administration API.

## Local setup

1. Install dependencies with `npm install`.
2. Copy the D1 database name and ID from Cloudflare into `wrangler.jsonc`.
3. Apply the schema:
   `npx wrangler d1 execute REPLACE_WITH_YOUR_D1_NAME --remote --file=migrations/0001_init.sql`
4. Create the grouped inventory SQL file:
   `npm run import:inventory -- "/absolute/path/CDs_Verified_Prices.xlsx"`
5. Import it:
   `npx wrangler d1 execute REPLACE_WITH_YOUR_D1_NAME --remote --file=data/inventory.sql`
6. In Cloudflare, add `ADMIN_PASSWORD`, `SESSION_SECRET`, and `DISCOGS_TOKEN` as encrypted Worker secrets. Never commit any of them. `SESSION_SECRET` should be a long, random value and is what protects your administrator session.
7. Start locally with `npm run dev`, then deploy with `npm run deploy`.

## Inventory model

The importer groups copies only when the Discogs release ID, verified CAD price, media condition and sleeve condition match. Variants with a different price or condition remain separate, so the buyer sees accurate availability.

## Discogs covers and categories

The public site never receives the Discogs token. To make a reviewable SQL update for cover art, category and Discogs rating-count, use a newly created token on your own computer:

`DISCOGS_TOKEN=your_new_token npm run enrich:discogs -- "/absolute/path/CDs_Verified_Prices.xlsx"`

This is intentionally rate-limited to stay below Discogs’ authenticated API allowance. It writes `data/discogs-enrichment.sql`; inspect it, then apply it with the same D1 command as step 5. A custom HD image URL entered in the private administration screen always takes priority over a Discogs image.

Discogs images/data must be used under Discogs’ API terms. The site includes its required non-affiliation notice.
