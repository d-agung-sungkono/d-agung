UPDATE os_affiliate_products
SET sort_order = 1
WHERE sort_order < 1;

ALTER TABLE os_affiliate_products
  ALTER COLUMN sort_order SET DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'os_affiliate_products_sort_order_min_check'
  ) THEN
    ALTER TABLE os_affiliate_products
      ADD CONSTRAINT os_affiliate_products_sort_order_min_check CHECK (sort_order >= 1);
  END IF;
END $$;
