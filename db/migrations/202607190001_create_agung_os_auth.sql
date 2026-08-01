CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS os_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_user_sessions_user_id_idx ON os_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS os_user_sessions_token_hash_idx ON os_user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS os_user_sessions_active_idx
  ON os_user_sessions(expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS os_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES os_users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES os_user_sessions(id) ON DELETE SET NULL,
  username_attempted TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_login_logs_user_id_idx ON os_login_logs(user_id);
CREATE INDEX IF NOT EXISTS os_login_logs_created_at_idx ON os_login_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS socmeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  base_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS account_groups_user_id_idx ON account_groups(user_id);

CREATE TABLE IF NOT EXISTS user_socmeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  socmed_id UUID NOT NULL REFERENCES socmeds(id) ON DELETE RESTRICT,
  account_group_id UUID REFERENCES account_groups(id) ON DELETE SET NULL,
  account TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  linked_email TEXT,
  linked_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, socmed_id, account)
);

CREATE INDEX IF NOT EXISTS user_socmeds_user_id_idx ON user_socmeds(user_id);
CREATE INDEX IF NOT EXISTS user_socmeds_socmed_id_idx ON user_socmeds(socmed_id);
CREATE INDEX IF NOT EXISTS user_socmeds_account_group_id_idx ON user_socmeds(account_group_id);
