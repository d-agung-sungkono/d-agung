DELETE FROM content_posts cp
USING user_socmeds us, socmeds s
WHERE cp.user_socmed_id = us.id
  AND us.socmed_id = s.id
  AND NOT (s.name = 'TikTok' AND us.account = 'd.agung.sungkono');
