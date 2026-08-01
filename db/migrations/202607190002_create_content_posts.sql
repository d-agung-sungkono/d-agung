CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  user_socmed_id UUID REFERENCES user_socmeds(id) ON DELETE SET NULL,
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'ready', 'published', 'skipped')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_key)
);

CREATE INDEX IF NOT EXISTS content_posts_user_id_idx ON content_posts(user_id);
CREATE INDEX IF NOT EXISTS content_posts_user_socmed_id_idx ON content_posts(user_socmed_id);
CREATE INDEX IF NOT EXISTS content_posts_status_idx ON content_posts(status);
CREATE INDEX IF NOT EXISTS content_posts_scheduled_at_idx ON content_posts(scheduled_at DESC);
