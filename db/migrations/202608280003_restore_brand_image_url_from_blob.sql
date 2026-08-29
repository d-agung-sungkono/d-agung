UPDATE os_brands
SET
  image_url = '/os/brands/image/' || id,
  updated_at = now()
WHERE image_blob IS NOT NULL
  AND NULLIF(image_url, '') IS NULL;
