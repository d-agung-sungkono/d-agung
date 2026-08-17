CREATE TABLE IF NOT EXISTS os_affiliate_product_content_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES os_affiliate_products(id) ON DELETE CASCADE,
  content_post_id UUID REFERENCES content_posts(id) ON DELETE SET NULL,
  title TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, url)
);

CREATE INDEX IF NOT EXISTS os_affiliate_product_content_links_product_id_idx
  ON os_affiliate_product_content_links(product_id);

CREATE INDEX IF NOT EXISTS os_affiliate_product_content_links_content_post_id_idx
  ON os_affiliate_product_content_links(content_post_id);
