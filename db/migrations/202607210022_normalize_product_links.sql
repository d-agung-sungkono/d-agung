DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'os_products'
      AND column_name = 'source'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'os_products'
      AND column_name = 'source_url'
  ) THEN
    EXECUTE $migration$
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
      WHERE source_url IS NOT NULL
        AND source IS NOT NULL
      ON CONFLICT (product_id, source)
      DO UPDATE SET
        source_url = EXCLUDED.source_url,
        status = EXCLUDED.status,
        updated_at = now()
    $migration$;
  END IF;
END $$;

ALTER TABLE os_products
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS source_url;
