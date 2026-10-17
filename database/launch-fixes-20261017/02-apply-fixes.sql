WITH changes (listing_key, group_id, old_price_cad, old_release_id, old_label_name, old_format, old_release_year, old_quantity, old_status, old_is_hidden, new_price_cad, new_release_id, new_label_name, new_format, new_release_year, new_quantity, new_status, new_is_hidden) AS (VALUES
('1734171-ZRhNKeUxGaS0', '1734171-ZRhNKeUxGaS0', 56, '1734171', 'Aftermath Entertainment, Interscope Records, Shady Records', 'CD, Album', 2002, 1, 'available', 0, 8, '1734171', 'Aftermath Entertainment, Interscope Records, Shady Records', 'CD, Album', 2002, 1, 'available', 0),
('5186137-Z1KlTF8yKGvt', '5186137-Z1KlTF8yKGvt', 49, '5186137', 'EMI Classics', 'CD, Comp', 1993, 1, 'available', 0, 8, '5186137', 'EMI Classics', 'CD, Comp', 1993, 1, 'available', 0),
('6062247-p9LYdWjoDLt1', '6062247-p9LYdWjoDLt1', 27, '6062247', 'Score, Score', 'CD', 1983, 1, 'available', 0, 8, '6062247', 'Score, Score', 'CD', 1983, 1, 'available', 0),
('2583068-8bpyW6uFvn0-', '2583068-8bpyW6uFvn0-', 26, '2583068', 'Polskie Nagrania Muza', 'CD, Album', 1990, 1, 'available', 0, 15, '2583068', 'Polskie Nagrania Muza', 'CD, Album', 1990, 1, 'available', 0),
('3759370-YFufE_He9eem', '3759370-YFufE_He9eem', 22, '3759370', 'Philips', 'CD, Album', 1991, 1, 'available', 0, 8, '3759370', 'Philips', 'CD, Album', 1991, 1, 'available', 0),
('8594641-rEpqjBWZCqbl', '8594641-rEpqjBWZCqbl', 18, '8594641', 'Philips', 'CD, Comp, Mono', 1972, 1, 'available', 0, 6, '8594641', 'Philips', 'CD, Comp, Mono', 1972, 1, 'available', 0),
('4335205-0Jt71eCadlad', '4335205-0Jt71eCadlad', 22, '4335205', 'Polydor', 'CD, Album', 1988, 1, 'available', 0, 22, '4335205', 'Polydor', 'CD, Album', 1988, 1, 'available', 1),
('2558210-7ZUNR-RA_X4K', '2558210-7ZUNR-RA_X4K', 5, '2558210', 'Columbia', 'CD, Album', 1992, 1, 'available', 0, 5, '10507602', 'Columbia', 'CD, Album', 1992, 1, 'available', 0),
('1667102-AWochj0l3tP_', '1667102-AWochj0l3tP_', 5, '1667102', 'Enigma (4), Capitol Records', 'CD, Comp', 1990, 1, 'available', 0, 5, '1377944', 'Capitol Records, Enigma (4)', 'CD, Album', 1990, 1, 'available', 0),
('vinyl-20261016-306aa6d5d1ac4b4066ca', 'vinyl-20261016-306aa6d5d1ac4b4066ca', 2, '6147567', 'Able', 'Vinyl, LP', 1975, 1, 'available', 0, 2, '6147567', 'Able', 'Vinyl, LP', 1975, 2, 'available', 0),
('vinyl-20261016-772251a86f4ac17628de', 'vinyl-20261016-306aa6d5d1ac4b4066ca', 4, '6147567', 'Able', 'Vinyl, LP', 1975, 1, 'available', 0, 4, '6147567', 'Able', 'Vinyl, LP', 1975, 0, 'sold', 1),
('vinyl-20261016-6669122750f731fab2da', 'vinyl-20261016-a81b2a91c58069ba8b89', 10, '4083452', 'Reprise Records', 'Vinyl, LP', 1968, 0, 'sold', 0, 10, '4083452', 'Reprise Records', 'Vinyl, LP', 1968, 0, 'sold', 1),
('vinyl-20261016-61f617e5903f061b3bf0', 'vinyl-20261016-c726f0f35d4a3c31ffcf', 2, '960742', 'Polydor', 'Vinyl, LP', 1969, 0, 'sold', 0, 2, '960742', 'Polydor', 'Vinyl, LP', 1969, 0, 'sold', 1),
('vinyl-20261016-0c355b883fd07ebb6f03', 'vinyl-20261016-0c355b883fd07ebb6f03', 5, '3839450', 'Les Disques Millionnaires', 'Vinyl, LP', 1978, 1, 'available', 0, 5, '3839450', 'Les Disques Millionnaires', 'Vinyl, LP', 1978, 2, 'available', 0),
('vinyl-20261016-b03546f9ed968dce2475', 'vinyl-20261016-0c355b883fd07ebb6f03', 5, '3839450', 'Les Disques Millionnaires', 'Vinyl, LP', 1978, 1, 'available', 0, 5, '3839450', 'Les Disques Millionnaires', 'Vinyl, LP', 1978, 0, 'sold', 1)
), eligible AS MATERIALIZED (SELECT c.listing_key FROM changes c WHERE NOT EXISTS (SELECT 1 FROM changes m LEFT JOIN releases s ON s.listing_key = m.listing_key WHERE m.group_id = c.group_id AND NOT (s.listing_key IS NOT NULL AND s.price_cad IS m.old_price_cad AND s.release_id IS m.old_release_id AND s.label_name IS m.old_label_name AND s.format IS m.old_format AND s.release_year IS m.old_release_year AND s.quantity IS m.old_quantity AND s.status IS m.old_status AND s.is_hidden IS m.old_is_hidden)))
UPDATE releases AS r SET
price_cad = (SELECT new_price_cad FROM changes WHERE listing_key = r.listing_key),
release_id = (SELECT new_release_id FROM changes WHERE listing_key = r.listing_key),
label_name = (SELECT new_label_name FROM changes WHERE listing_key = r.listing_key),
format = (SELECT new_format FROM changes WHERE listing_key = r.listing_key),
release_year = (SELECT new_release_year FROM changes WHERE listing_key = r.listing_key),
quantity = (SELECT new_quantity FROM changes WHERE listing_key = r.listing_key),
status = (SELECT new_status FROM changes WHERE listing_key = r.listing_key),
is_hidden = (SELECT new_is_hidden FROM changes WHERE listing_key = r.listing_key),
updated_at = CURRENT_TIMESTAMP
WHERE r.listing_key IN (SELECT listing_key FROM eligible)
RETURNING listing_key, artist, title, price_cad, release_id, quantity, status, is_hidden;
