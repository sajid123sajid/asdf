ALTER TABLE products ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN attributes_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN publish_status TEXT NOT NULL DEFAULT 'draft'
  CHECK (publish_status IN ('draft', 'review', 'published', 'scheduled', 'archived'));

CREATE INDEX IF NOT EXISTS idx_products_publish_status ON products(publish_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tag_search ON products(slug, category_slug, status);
