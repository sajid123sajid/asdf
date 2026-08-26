-- Editorial catalog foundation: structured SKUs, attributes, inventory, merchandising, and content.
-- Existing products remain compatible; current JSON fields are retained for staged backfill.

ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'physical';
ALTER TABLE products ADD COLUMN bullet_points_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN search_keywords TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN published_at TEXT;
ALTER TABLE products ADD COLUMN scheduled_for TEXT;
ALTER TABLE products ADD COLUMN review_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (review_status IN ('incomplete', 'ready', 'approved', 'rejected'));
ALTER TABLE products ADD COLUMN return_policy TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN shipping_notes TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL AND sku <> '';
CREATE INDEX idx_products_scheduled ON products(status, scheduled_for);
CREATE INDEX idx_products_review_status ON products(review_status, updated_at DESC);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  option_values_json TEXT NOT NULL DEFAULT '{}',
  price REAL,
  old_price REAL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  image_key TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id, is_active);
CREATE INDEX idx_product_variants_stock ON product_variants(stock, low_stock_threshold);

CREATE TABLE product_attribute_definitions (
  id TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  label TEXT NOT NULL,
  input_type TEXT NOT NULL DEFAULT 'text'
    CHECK (input_type IN ('text', 'number', 'select', 'multiselect', 'boolean')),
  options_json TEXT NOT NULL DEFAULT '[]',
  is_required INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(category_slug, attribute_key)
);

CREATE TABLE product_attribute_values (
  product_id TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT 'null',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, attribute_key),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT,
  product_id TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_variant ON inventory_movements(variant_id, created_at DESC);

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  starts_at TEXT,
  ends_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_products (
  collection_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_products_order ON collection_products(collection_id, sort_order);

CREATE TABLE editorial_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '[]',
  cover_image_key TEXT,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  scheduled_for TEXT,
  author_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_editorial_pages_status ON editorial_pages(status, scheduled_for);

CREATE TABLE editorial_revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'collection', 'page')),
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, version),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_editorial_revisions_entity ON editorial_revisions(entity_type, entity_id, version DESC);
