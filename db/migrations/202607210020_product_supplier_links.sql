ALTER TABLE os_products
  DROP CONSTRAINT IF EXISTS os_products_user_id_source_url_key;

CREATE TABLE IF NOT EXISTS os_product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES os_products(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, source)
);

CREATE INDEX IF NOT EXISTS os_product_links_product_id_idx ON os_product_links(product_id);
CREATE INDEX IF NOT EXISTS os_product_links_source_idx ON os_product_links(source);
CREATE INDEX IF NOT EXISTS os_product_links_status_idx ON os_product_links(status);

ALTER TABLE os_product_snapshots
  ADD COLUMN IF NOT EXISTS product_link_id UUID REFERENCES os_product_links(id) ON DELETE CASCADE;

INSERT INTO os_product_links (
  product_id,
  source,
  source_url,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  source,
  source_url,
  status,
  created_at,
  updated_at
FROM os_products
WHERE NOT EXISTS (
  SELECT 1
  FROM os_product_links opl
  WHERE opl.source_url = os_products.source_url
);

UPDATE os_product_snapshots ops
SET product_link_id = opl.id
FROM os_product_links opl
WHERE ops.product_link_id IS NULL
  AND ops.product_id = opl.product_id;
