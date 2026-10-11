CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_key TEXT NOT NULL UNIQUE,
  release_id TEXT NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  label_name TEXT,
  format TEXT,
  release_year INTEGER,
  media_condition TEXT,
  sleeve_condition TEXT,
  notes TEXT,
  price_cad REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available',
  category TEXT NOT NULL DEFAULT 'Other',
  discogs_image_url TEXT,
  custom_image_url TEXT,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_releases_catalog ON releases(status, artist, title);
CREATE INDEX IF NOT EXISTS idx_releases_filters ON releases(category, media_condition, price_cad);
CREATE INDEX IF NOT EXISTS idx_releases_release_id ON releases(release_id);

CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
