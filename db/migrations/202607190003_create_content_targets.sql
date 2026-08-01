CREATE TABLE IF NOT EXISTS content_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  user_socmed_id UUID NOT NULL REFERENCES user_socmeds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cadence_days INTEGER NOT NULL CHECK (cadence_days > 0),
  start_date DATE NOT NULL,
  preferred_time TIME,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, user_socmed_id, name)
);

CREATE INDEX IF NOT EXISTS content_targets_user_id_idx ON content_targets(user_id);
CREATE INDEX IF NOT EXISTS content_targets_user_socmed_id_idx ON content_targets(user_socmed_id);
CREATE INDEX IF NOT EXISTS content_targets_status_idx ON content_targets(status);
