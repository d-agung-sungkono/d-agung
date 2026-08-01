CREATE TABLE IF NOT EXISTS os_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  variant TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_url)
);

CREATE INDEX IF NOT EXISTS os_products_user_id_idx ON os_products(user_id);
CREATE INDEX IF NOT EXISTS os_products_sku_idx ON os_products(sku);
CREATE INDEX IF NOT EXISTS os_products_status_idx ON os_products(status);

CREATE TABLE IF NOT EXISTS os_product_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES os_products(id) ON DELETE CASCADE,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_price INTEGER,
  final_price INTEGER,
  discount_amount INTEGER,
  discount_percent NUMERIC(8, 2),
  stock_status TEXT NOT NULL DEFAULT 'unknown',
  stock_available_count INTEGER NOT NULL DEFAULT 0,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_product_snapshots_product_id_idx ON os_product_snapshots(product_id);
CREATE INDEX IF NOT EXISTS os_product_snapshots_scraped_at_idx ON os_product_snapshots(scraped_at DESC);

CREATE TABLE IF NOT EXISTS os_product_branch_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES os_product_snapshots(id) ON DELETE CASCADE,
  branch_id TEXT,
  branch_name TEXT NOT NULL,
  stock_text TEXT NOT NULL,
  stock_type TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_product_branch_stocks_snapshot_id_idx ON os_product_branch_stocks(snapshot_id);
CREATE INDEX IF NOT EXISTS os_product_branch_stocks_available_idx ON os_product_branch_stocks(is_available);
