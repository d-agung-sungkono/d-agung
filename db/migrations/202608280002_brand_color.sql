ALTER TABLE os_brands
  ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT '#2563eb';

ALTER TABLE os_brands
  ADD CONSTRAINT os_brands_brand_color_hex_check
  CHECK (brand_color ~ '^#[0-9A-Fa-f]{6}$')
  NOT VALID;

ALTER TABLE os_brands
  VALIDATE CONSTRAINT os_brands_brand_color_hex_check;
