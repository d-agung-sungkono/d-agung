ALTER TABLE os_products
  ADD COLUMN IF NOT EXISTS primary_image BYTEA,
  ADD COLUMN IF NOT EXISTS primary_image_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS primary_image_source_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_image_updated_at TIMESTAMPTZ;
