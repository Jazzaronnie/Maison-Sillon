WITH changes (listing_key, old_price, new_price) AS (VALUES
('2558210-7ZUNR-RA_X4K', 143, 5),
('1667102-AWochj0l3tP_', 77, 8),
('1734171-ZRhNKeUxGaS0', 56, 8),
('5186137-Z1KlTF8yKGvt', 49, 8),
('2583068-8bpyW6uFvn0-', 26, 15),
('3759370-YFufE_He9eem', 22, 8),
('4335205-0Jt71eCadlad', 22, 5),
('6062247-p9LYdWjoDLt1', 27, 8),
('8594641-rEpqjBWZCqbl', 18, 6)
) UPDATE releases SET price_cad=(SELECT new_price FROM changes WHERE changes.listing_key=releases.listing_key), updated_at=CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM changes WHERE changes.listing_key=releases.listing_key AND changes.old_price=releases.price_cad) RETURNING artist, title, price_cad;
