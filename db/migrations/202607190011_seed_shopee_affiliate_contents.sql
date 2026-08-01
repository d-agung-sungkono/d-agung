WITH os_user AS (
  SELECT id
  FROM os_users
  WHERE username = COALESCE(NULLIF(current_setting('app.os_username', true), ''), 'd.agung')
  LIMIT 1
),
shopee_account AS (
  SELECT us.id AS user_socmed_id, us.user_id
  FROM user_socmeds us
  INNER JOIN socmeds s ON s.id = us.socmed_id
  INNER JOIN os_user ou ON ou.id = us.user_id
  WHERE s.name = 'Shopee'
    AND us.account = 'keranjang.diskon'
  LIMIT 1
),
seed_contents(source_key, title, url, scheduled_at) AS (
  VALUES
    (
      'shopee-affiliate:paket-kopi-homebrew-1',
      'paket-kopi-homebrew-1',
      'https://id.shp.ee/tjkbl5av?smtt=0.0.9',
      '2026-06-26T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:jacket-wind-breaker-1',
      'jacket-wind-breaker-1',
      'https://id.shp.ee/kwwnjirn?smtt=0.0.9',
      '2026-06-28T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:ranjang-laundry-ikea',
      'ranjang-laundry-ikea',
      'https://id.shp.ee/2lrj7qk5?smtt=0.0.9',
      '2026-06-30T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:kursi-gaming-1',
      'kursi-gaming-1',
      'https://id.shp.ee/2satpb2i?smtt=0.0.9',
      '2026-07-02T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:jean-kuwlot-1',
      'jean-kuwlot-1',
      'https://id.shp.ee/82xljh70?smtt=0.0.9',
      '2026-07-04T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:gantungan-baju-ikea',
      'gantungan-baju-ikea',
      'https://id.shp.ee/o80qlp73?smtt=0.0.9',
      '2026-07-06T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:shoe-saddle-1',
      'shoe-saddle-1',
      'https://id.shp.ee/hcu5r9lc?smtt=0.0.9',
      '2026-07-08T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:botol-minyak-spray-1',
      'botol-minyak-spray-1',
      'https://id.shp.ee/xmjgbbnk?smtt=0.0.9',
      '2026-07-10T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:shoe-saddle-2',
      'shoe-saddle-2',
      'https://id.shp.ee/ea5cml5i?smtt=0.0.9',
      '2026-07-12T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:shoe-saddle-3',
      'shoe-saddle-3',
      'https://id.shp.ee/ok9vityy?smtt=0.0.9',
      '2026-07-14T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:racket-padel-wilson-1',
      'racket-padel-wilson-1',
      'https://id.shp.ee/twrnsh4k?smtt=0.0.9',
      '2026-07-16T12:00:00+07:00'::timestamptz
    ),
    (
      'shopee-affiliate:ikea-tisken',
      'ikea-tisken',
      'https://id.shp.ee/69j9dpr9?smtt=0.0.9',
      '2026-07-18T12:00:00+07:00'::timestamptz
    )
)
INSERT INTO content_posts (
  user_id,
  user_socmed_id,
  source_key,
  title,
  url,
  scheduled_at,
  published_at,
  status,
  notes,
  metadata
)
SELECT
  sa.user_id,
  sa.user_socmed_id,
  sc.source_key,
  sc.title,
  sc.url,
  sc.scheduled_at,
  sc.scheduled_at,
  'published',
  'Shopee affiliate content',
  jsonb_build_object(
    'source', 'manual-seed',
    'channel', 'shopee-affiliate',
    'slug', sc.title
  )
FROM shopee_account sa
CROSS JOIN seed_contents sc
ON CONFLICT (user_id, source_key)
DO UPDATE SET
  user_socmed_id = EXCLUDED.user_socmed_id,
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  scheduled_at = EXCLUDED.scheduled_at,
  published_at = EXCLUDED.published_at,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  metadata = EXCLUDED.metadata,
  updated_at = now();
