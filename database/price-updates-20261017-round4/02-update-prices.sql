WITH prices (listing_key, release_id, old_price, new_price) AS (VALUES
('10117754-sCXwP59yQuUP', '10117754', 50, 15),
('382937-wRR-a9HI2RJw', '382937', 46, 13),
('3364-AC5Pj4pn0sgl', '3364', 39, 12),
('10453265-h_dD9YkHF9-c', '10453265', 35, 10),
('7712193-ONgM1o0qoJuG', '7712193', 34, 10),
('4207554-8UgZ_H5-48lD', '4207554', 32, 10),
('11758482-Zj1h8LPxIzhu', '11758482', 32, 9),
('541619-fp_hneMwIxUy', '541619', 31, 12),
('349133-Spc2DpB7mwwf', '349133', 27, 8),
('8315499-X5dTLsCduqbw', '8315499', 25, 7),
('8544010-5fQUyLvb_aOY', '8544010', 56, 12))
UPDATE releases AS r
SET price_cad = (SELECT p.new_price FROM prices p WHERE p.listing_key = r.listing_key),
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM prices p WHERE p.listing_key = r.listing_key AND p.release_id = r.release_id AND p.old_price = r.price_cad)
RETURNING listing_key, artist, title, price_cad;
