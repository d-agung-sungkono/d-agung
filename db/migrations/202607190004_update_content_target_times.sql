WITH os_user AS (
  SELECT id
  FROM os_users
  WHERE username = COALESCE(NULLIF(current_setting('app.os_username', true), ''), 'd.agung')
  LIMIT 1
),
branding_tiktok_socmed AS (
  SELECT us.id
  FROM user_socmeds us
  INNER JOIN socmeds s ON s.id = us.socmed_id
  INNER JOIN account_groups ag ON ag.id = us.account_group_id
  INNER JOIN os_user ou ON ou.id = us.user_id
  WHERE s.name = 'TikTok'
    AND ag.name = 'Agung Branding'
    AND us.account = 'd.agung.sungkono'
  LIMIT 1
)
UPDATE content_targets
SET
  name = 'TikTok Contents',
  preferred_time = '12:00',
  updated_at = now()
WHERE name = 'Agung Branding TikTok Content'
  AND user_socmed_id = (SELECT id FROM branding_tiktok_socmed);

WITH os_user AS (
  SELECT id
  FROM os_users
  WHERE username = COALESCE(NULLIF(current_setting('app.os_username', true), ''), 'd.agung')
  LIMIT 1
),
branding_tiktok_socmed AS (
  SELECT us.id
  FROM user_socmeds us
  INNER JOIN socmeds s ON s.id = us.socmed_id
  INNER JOIN account_groups ag ON ag.id = us.account_group_id
  INNER JOIN os_user ou ON ou.id = us.user_id
  WHERE s.name = 'TikTok'
    AND ag.name = 'Agung Branding'
    AND us.account = 'd.agung.sungkono'
  LIMIT 1
)
INSERT INTO content_targets (
  user_id,
  user_socmed_id,
  name,
  cadence_days,
  start_date,
  preferred_time,
  timezone,
  status
)
SELECT
  ou.id,
  bts.id,
  'Agung Branding Contents',
  3,
  '2026-07-15',
  '19:00',
  'Asia/Jakarta',
  'active'
FROM os_user ou
CROSS JOIN branding_tiktok_socmed bts
ON CONFLICT (user_id, user_socmed_id, name)
DO UPDATE SET
  cadence_days = EXCLUDED.cadence_days,
  start_date = EXCLUDED.start_date,
  preferred_time = EXCLUDED.preferred_time,
  timezone = EXCLUDED.timezone,
  status = EXCLUDED.status,
  updated_at = now();
