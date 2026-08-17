ALTER TABLE os_affiliate_products
  ADD COLUMN IF NOT EXISTS image_blob BYTEA,
  ADD COLUMN IF NOT EXISTS image_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMPTZ;
