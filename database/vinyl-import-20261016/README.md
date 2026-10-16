# Maison Sillon — Vinyl catalogue and CD prices

The website changes are prepared in your Maison-Sillon repository. They are not live until you push them and update the existing D1 database. No new database is needed.

1. In GitHub Desktop, review the Maison-Sillon changes, commit and **Push origin**. Wait for Cloudflare’s deployment to finish. This publishes the filter, labels and artwork.
2. Open Cloudflare → Storage & databases → D1 → **maison_sillon** → **Console**. Open each numbered SQL file (01 through 06), copy its complete contents and run it there, one file at a time. Each is a single query; successful inserts may say “This query returned no data.” Repeating a file will not duplicate the listings or overwrite later admin edits.
3. Run **update-cd-prices.sql** in the same console. It applies the nine agreed prices to the specific existing CD listings only when their previous price still matches.
4. Run **verify-vinyls.sql**. Expected results: **312 imported**, **263 available**, **28 sold**, **21 hidden**. Refresh the live site and choose **Vinyl**.

After import you can change vinyl prices, quantities, condition, images and visibility from the same **/manage.html** admin page as the CDs. Use Format “Vinyl” for new vinyl listings, and Media condition “Used — condition to confirm” when ungraded. To remove a record from the public catalogue, check Hidden; to show its Sold ribbon, mark Sold.

All imported vinyls use **Used — condition to confirm**, with sleeves **Not graded**. No playback test or individual condition assessment has been claimed. Original Marketplace condition descriptions remain in inventory-import-review.csv for your reference, not as customer-facing grades.

Three exact duplicate source rows were imported once: Nana Mouskouri — Je Chante Avec Toi Liberté; Nana Mouskouri — Christmas With Nana Mouskouri; Elvis Presley — Elvis In Hollywood. Distinct copies with different prices, conditions or availability remain separate listings. If any skipped duplicate is a second physical copy, add it through the admin interface.

Photo update (October 16): all **312 imported listings now have images**. **82 seller photos** fill missing artwork or replace a different sleeve/record-only image; matching existing cover artwork remains. All 315 supplied photo entries were checked. Label details are supplied for305 listings and direct Discogs album references for 279. The remaining 33 use explicit Discogs search links;7 labels remain To be verified. Exact physical pressings are not certified from front-cover photos alone.

`photo-match-review.csv` records the image decision for each supplied photo. `vinyl-details-review.csv` records the original and corrected titles, label, catalogue and reference status. Clear mismatches corrected include Frank Sinatra—Frankie, Jean Nichol—Sur scène, Various—J’avais20 ans, Michèle Richard—70…, Various—True Love, Frank Sinatra—Sinatra’sSinatra, and the solo Éric Charden sleeve. Claire Lepage’s face-only sleeve stays “album à identifier” until confirmed.

Use the current numbered SQL files in this folder, which contain the updated photos and metadata. Earlier downloaded copies of the import files are out of date. The incomplete Beatles set remains hidden as in your source file.

CD prices: Céline Dion — Celine Dion $5; Poison — Flesh & Blood $8; Eminem — The Eminem Show $8; Coro De Monjes — Las Mejores Obras Del Canto Gregoriano $8; Cher — Heart Of Stone $15; Gheorghe Zamfir — Love Songs $8; Patricia Kaas — Mademoiselle Chante... $5; Grand Orchestre International — Hymnes Nationaux $8; Edith Piaf — Mon Légionnaire $6. The last two are provisional ordinary-CD prices at your request. Their exact editions have not been identified.

The existing Hymnes Nationaux reference (6062247) is a Score vinyl LP (SCO 9038 / 331451). A related Grand Orchestre International CD is documented by the Bibliothèque nationale de France: Hymnes Nationaux & Sonneries Réglementaires, Accord **400032**, 1989. This is a lead, not confirmation of your copy: https://catalogue.bnf.fr/ark:/12148/cb381722840

The existing Mon Légionnaire reference (8594641) is the 1972 Philips LP **6311 110**. Do not replace it with an arbitrary CD edition without a barcode or catalogue number. The website marks its edition To be verified.
