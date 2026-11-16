-- Apply this migration to your Cloudflare D1 database before enabling registrations.
CREATE TABLE IF NOT EXISTS early_access (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  company TEXT NOT NULL,
  city TEXT NOT NULL,
  team_size TEXT NOT NULL,
  challenge TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_early_access_created_at ON early_access(created_at);
