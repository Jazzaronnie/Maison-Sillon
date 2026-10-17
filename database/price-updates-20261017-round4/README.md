# 11 requested CD price changes — October 17, 2026

All 11 release IDs were found exactly once in the live public inventory of 1,441 listings, and each is a CD listing. These are your requested prices, not a new market valuation. Edition references, grading, status, stock, labels and images are unchanged.

## Apply in Cloudflare

Open Cloudflare → D1 → maison_sillon → Console. Copy and execute each complete file separately, in order:

1. 01-backup.sql — saves the 11 original listings in a separate backup table. No returned data is normal.
2. 02-update-prices.sql — applies all 11 prices as a single SQL statement. Expected: 11 returned rows. Records whose price or release ID changed since review are skipped for safety.
3. 03-verify-prices.sql — lists all 11 CDs and their prices for review.

Then Commit and Push origin in GitHub Desktop to publish the updated saved catalogue. Pushing the repository does not execute SQL against D1. The live website uses D1 prices; allow about 60 seconds or refresh after executing the SQL.

## Checks and recovery

Tested with a complete local SQLite copy: exactly 11 updates; every requested price matches; unrelated records and non-price fields are preserved; repeat execution changes nothing; rollback restores the original prices. No stock or listings were added or removed.

rollback-only-if-needed.sql restores the backed-up prices for these 11 listings only. Do not execute it unless you intend to reverse these changes; it could replace later price edits on those same listings.

The room experiment was stopped at your request and has not been modified. The current website design is unchanged.
