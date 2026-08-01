DELETE FROM content_targets
WHERE name = 'TikTok Contents';

UPDATE content_targets
SET
  preferred_time = '12:00',
  updated_at = now()
WHERE name = 'Keranjang Diskon Shopee Contents';
