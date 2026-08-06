CREATE TABLE IF NOT EXISTS os_product_scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  run_number INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'batch')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, run_number)
);

CREATE INDEX IF NOT EXISTS os_product_scrape_runs_user_started_idx ON os_product_scrape_runs(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS os_product_scrape_runs_status_idx ON os_product_scrape_runs(status);

ALTER TABLE os_product_snapshots
  ADD COLUMN IF NOT EXISTS scrape_run_id UUID REFERENCES os_product_scrape_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS os_product_snapshots_scrape_run_id_idx ON os_product_snapshots(scrape_run_id);
