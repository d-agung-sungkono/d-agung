DELETE FROM content_targets
WHERE name = 'TikTok Contents';

UPDATE content_targets
SET
  cadence_days = 3,
  start_date = '2026-07-19',
  preferred_time = '19:00',
  status = 'active',
  updated_at = now()
WHERE name = 'Agung Branding Contents';

UPDATE content_targets
SET
  cadence_days = 2,
  start_date = '2026-07-20',
  preferred_time = '12:00',
  status = 'active',
  updated_at = now()
WHERE name = 'Keranjang Diskon Shopee Contents';
