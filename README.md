# Connect Maison Sillon to your existing Cloudflare database

This package is prepared and locally tested, but has not been deployed to your Cloudflare account. It uses the existing Worker `maison-sillon`, database `maison_sillon`, and bindings `DB` and `ASSETS`.

## 1. Existing database configured

The package is configured for your existing database `maison_sillon`, ID `0efd51d0-e4d1-46a8-8219-ff915cdcca14`, and your Cloudflare account. These are identifiers, not passwords. Keep the existing Worker name `maison-sillon` and bindings `DB` and `ASSETS`.

## 2. Database update completed — do not rerun

The owner applied the update in Cloudflare on 2026-10-12. The Console confirmed the new `is_hidden` column, the CD-format update, and cassette hiding. The final count was 1,163 total records and 8 hidden, leaving 1,155 public listings. An inventory copy was saved as `releases_backup_before_connection_20261012`.

Do not run `01-update-existing-database.sql` again. It is included only as a record of the applied migration. Do not create or replace the database and do not import the bundled inventory JSON into D1.

## 3. Keep the existing admin secrets

Your current Worker uses `ADMIN_PASSWORD` and `SESSION_SECRET`. Leave them configured in Cloudflare. If either is missing, add it as a Worker secret in Settings > Variables and Secrets. Use your own strong admin password and a long random session secret. They are not included in this package and should not be pasted into chat or website files.

## 4. Deploy through the connected GitHub repository

In Cloudflare, check Workers & Pages → maison-sillon → Settings → Builds. Repository: `Jazzaronnie/Maison-Sillon`; production branch: `main`; root directory: `/`; deploy command: `npx wrangler deploy`. No site build command is required. Commit and push website/code changes to `main` to trigger deployment when Builds is connected. The ready-to-upload website files are in `public/`; the Worker is `src/worker.js`.

Inventory edits through `/manage.html` write directly to D1 and do not require a GitHub commit or deployment.

For manual deployment:

```sh
npx wrangler deploy
```

This updates the existing `maison-sillon` Worker and uploads the complete `public` directory, including the actual cover files. It does not just upload the standalone preview HTML. The site reads `/api/inventory` on the same origin, so a separate cross-origin permission is unnecessary for this deployment.

The package preserves the API's existing login and edit mechanisms and adds the editor and visibility support. If your existing deployment has extra routes, scheduled jobs, or bindings beyond DB/ASSETS, merge those existing configuration entries into `wrangler.jsonc` before deploying. Verify any existing custom domain still routes to this Worker.

## 5. Open your inventory editor

Visit `https://maison-sillon.justun978.workers.dev/manage.html` after deployment and sign in with the existing admin password. You can add CDs, edit prices, CD/sleeve conditions, notes, format, genres and cover image URLs.

- Sold: select Sold and save. Quantity becomes zero; the public listing remains with a red SOLD/VENDU ribbon and no active cart button.
- Hidden: check Hidden and save. The listing disappears publicly but stays in the database and editor.
- Restore: uncheck Hidden. To sell it again, choose Available and set quantity to at least one.
- New cover: enter a public image URL in Cover image URL. Existing downloaded artwork remains available automatically.

The inventory editor currently uses English labels; the public catalogue retains its French/English toggle. Login protects inventory reads and writes; the editor's static HTML itself contains no private inventory.

## 6. Verify the live connection

Use one existing CD to check a reversible price or notes change, refresh the public website, and restore the value. Then mark that listing sold, verify the ribbon and disabled cart action, and restore its previous availability/quantity. Finally hide and restore it to verify removal. Complete these checks before announcing the site.

The catalogue refreshes on opening, every 60 seconds, and when its window regains focus. Changes are not pushed instantly. The API supplies the authoritative list (including sold, excluding hidden); the client follows pagination so it can grow past 2,000 listings. A network failure retains the last usable catalogue, so Messenger availability confirmation remains necessary.

## Local validation completed

A temporary SQLite database populated from the inventory snapshot passed authentication, migration, all nine format corrections, cassette hiding, price/condition edits, sold state, hiding, creation, origin checks, and inventory pagination. The editor's login, search and price-save flow was also tested in a browser. These checks do not verify your real D1 table constraints or secrets; the live deployment checks above are still required.

Cloudflare references:
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/workers/configuration/secrets/
