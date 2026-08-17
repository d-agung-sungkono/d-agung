CREATE TABLE IF NOT EXISTS os_affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'affiliate' CHECK (type IN ('affiliate', 'dropship', 'owned')),
  marketplace TEXT NOT NULL DEFAULT 'other' CHECK (marketplace IN ('shopee', 'tokopedia', 'other')),
  destination_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS os_affiliate_products_user_id_idx ON os_affiliate_products(user_id);
CREATE INDEX IF NOT EXISTS os_affiliate_products_active_sort_idx
  ON os_affiliate_products(user_id, is_active, sort_order, created_at DESC);
