CREATE TABLE IF NOT EXISTS os_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
  direction TEXT,
  next_development TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_brands_user_id_idx ON os_brands(user_id);
CREATE INDEX IF NOT EXISTS os_brands_status_idx ON os_brands(status);
CREATE INDEX IF NOT EXISTS os_brands_created_at_idx ON os_brands(created_at DESC);

CREATE TABLE IF NOT EXISTS os_brand_social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES os_brands(id) ON DELETE CASCADE,
  user_socmed_id UUID NOT NULL REFERENCES user_socmeds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, user_socmed_id)
);

CREATE INDEX IF NOT EXISTS os_brand_social_media_accounts_brand_id_idx
  ON os_brand_social_media_accounts(brand_id);
CREATE INDEX IF NOT EXISTS os_brand_social_media_accounts_user_socmed_id_idx
  ON os_brand_social_media_accounts(user_socmed_id);
