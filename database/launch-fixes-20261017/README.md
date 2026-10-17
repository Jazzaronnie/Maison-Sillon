# Maison Sillon — catalogue corrections

Prepared from the public inventory checked on October 17, 2026. These files are prepared and tested; they have not been executed against your live D1 database.

## Apply to the live website

1. In Cloudflare, open Storage & databases → D1 → maison_sillon → Console.
2. Open 01-backup.sql, copy its entire contents into Console, and run it. “No data returned” is normal for this backup command.
3. Open 02-apply-fixes.sql, copy its entire contents into Console, and run it. It is a single SQL statement. On the reviewed inventory it returns 15 updated rows. If it returns fewer, some records have changed since review; check before doing anything else.
4. Run 03-check-results.sql to see the corrected listings and stock counts.
5. In GitHub Desktop, commit and Push origin to publish the updated saved catalogue. Database corrections require steps 2–4; pushing GitHub alone does not update D1.

The public catalogue reads D1 and refreshes within about 60 seconds. Expected public count after applying all corrections: 1,441, assuming no other inventory changes.

## Changes

- Eminem, The Eminem Show: $56 → $8.
- Coro De Monjes: $49 → $8.
- Hymnes Nationaux: $27 → $8; pressing still unconfirmed.
- Cher, Heart Of Stone: $26 → $15.
- Zamfir, Love Songs: $22 → $8.
- Piaf, Mon Légionnaire: $18 → $6; pressing still unconfirmed.
- Hide the old Patricia Kaas $22 listing; retain the correct-CD $11 listing.
- Céline Dion: preserve $5, set CD reference 10507602 (Columbia, 1992).
- Poison, Flesh & Blood: preserve $5, set CD reference 1377944 (Capitol / Enigma, 1990).
- Alain Barrière: one visible listing at $2, quantity 2.
- Les Classels: one visible listing at $5, quantity 2.
- Georges Moustaki: keep available listing at $2, quantity 1; archive sold row.
- Frank Sinatra's Greatest Hits: one sold listing at $5, quantity 0; archive extra sold row.

All other CD copies remain separate, including the differently graded Black Eyed Peas CDs. Pierre Lalonde's two self-titled vinyl records and Mireille Mathieu's similarly titled records have different release references; these have not been merged.

Extra rows are hidden, never deleted. The same physical stock is preserved: 263 available vinyl copies. For a grouped listing with quantity 2, after selling one copy set Quantity to 1 and leave Status as Available in the admin interface. Mark it Sold only after the last copy is sold. The customer selection still selects one copy at a time.

## Checks and recovery

The update was tested against a local SQLite copy of all 1,446 public rows: exact targeted values, preservation of unrelated rows and total remaining vinyl stock, safe repeat execution, and rollback. If a member of a vinyl pair changes before execution, the entire pair is skipped to avoid losing stock.

01-backup.sql saves the entire releases table in D1, including any hidden records. rollback-only-if-needed.sql restores only the fields and rows touched by this update; use it only if you want to reverse this change. It could replace later edits to those same rows, so do not run it casually.

The separate maison-sillon-before-launch-fixes-20261017.zip contains the website source before this update and a snapshot of the public catalogue. It does not contain login credentials or a full export of the private database.

## A separate room-design experiment

Keep the current main branch, live Worker, and production D1 database as the working website. Start the room design on a separate branch or copy and preview it locally first. If an online preview is needed, use a separate Cloudflare Worker and a separate test database or a read-only catalogue snapshot. Give the test site its own admin/session secrets. Check that it has no production D1 binding before enabling any admin writes. The public website changes only when you explicitly decide to merge and deploy the finished design.
