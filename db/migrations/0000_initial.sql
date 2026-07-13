PRAGMA foreign_keys = ON;

CREATE TABLE anonymous_visitors (
  id TEXT PRIMARY KEY NOT NULL,
  anonymous_token_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  first_country_code TEXT,
  first_device_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_anonymous_token_hash
ON anonymous_visitors(anonymous_token_hash);

CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  anonymous_visitor_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed','gave_up','abandoned')),
  created_at TEXT NOT NULL,
  started_at TEXT,
  ended_at TEXT,
  duration_ms INTEGER,
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0 AND correct_count <= 100),
  rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  temporary_error_count INTEGER NOT NULL DEFAULT 0 CHECK (temporary_error_count >= 0),
  country_code TEXT,
  device_type TEXT,
  referrer TEXT,
  landing_path TEXT NOT NULL DEFAULT '/',
  user_agent_family TEXT,
  ip_hash TEXT,
  last_activity_at TEXT NOT NULL,
  created_at_db TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (anonymous_visitor_id) REFERENCES anonymous_visitors(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_visitor_created
ON game_sessions(anonymous_visitor_id, created_at DESC);
CREATE INDEX idx_sessions_status_last_activity
ON game_sessions(status, last_activity_at);
CREATE INDEX idx_sessions_created
ON game_sessions(created_at DESC);

CREATE TABLE persons (
  qid TEXT PRIMARY KEY NOT NULL,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  wikipedia_title TEXT,
  wikipedia_url TEXT,
  primary_language TEXT,
  is_human INTEGER NOT NULL CHECK (is_human IN (0,1)),
  qualifies_as_woman INTEGER NOT NULL CHECK (qualifies_as_woman IN (0,1)),
  has_wikipedia_sitelink INTEGER NOT NULL CHECK (has_wikipedia_sitelink IN (0,1)),
  is_fictional INTEGER NOT NULL CHECK (is_fictional IN (0,1)),
  validation_status TEXT NOT NULL
    CHECK (validation_status IN ('verified','rejected','uncertain','stale')),
  validation_source TEXT NOT NULL
    CHECK (validation_source IN ('seed','wikipedia_wikidata','manual_override','import')),
  first_verified_at TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_persons_normalized_name
ON persons(normalized_name);
CREATE INDEX idx_persons_validation_status
ON persons(validation_status, last_verified_at);

CREATE TABLE person_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  person_qid TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT NOT NULL
    CHECK (alias_type IN ('canonical','alias','stage_name','birth_name','redirect','transliteration','manual')),
  language_code TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (person_qid) REFERENCES persons(qid) ON DELETE CASCADE,
  UNIQUE (person_qid, normalized_alias)
);

CREATE INDEX idx_alias_normalized
ON person_aliases(normalized_alias);
CREATE INDEX idx_alias_person
ON person_aliases(person_qid);

CREATE TABLE validation_overrides (
  id TEXT PRIMARY KEY NOT NULL,
  normalized_input TEXT,
  person_qid TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT','REJECT','AMBIGUOUS')),
  reason TEXT,
  canonical_name_override TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact_normalized_input','person_qid')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (person_qid) REFERENCES persons(qid) ON DELETE SET NULL
);

CREATE INDEX idx_overrides_input_active
ON validation_overrides(normalized_input, is_active);
CREATE INDEX idx_overrides_qid_active
ON validation_overrides(person_qid, is_active);

CREATE TABLE game_guesses (
  id TEXT PRIMARY KEY NOT NULL,
  game_session_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  raw_input TEXT NOT NULL,
  normalized_input TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('ACCEPTED','DUPLICATE','NOT_FOUND','NOT_A_PERSON','NOT_A_WOMAN','FICTIONAL','AMBIGUOUS','TEMPORARY_ERROR','INVALID_REQUEST','RATE_LIMITED','SESSION_NOT_FOUND','GAME_FINISHED')),
  failure_reason TEXT,
  person_qid TEXT,
  canonical_name_snapshot TEXT,
  description_snapshot TEXT,
  response_time_ms INTEGER NOT NULL,
  cache_hit INTEGER NOT NULL DEFAULT 0 CHECK (cache_hit IN (0,1)),
  cache_layer TEXT CHECK (cache_layer IN ('kv','d1') OR cache_layer IS NULL),
  source_used TEXT NOT NULL,
  override_id TEXT,
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (person_qid) REFERENCES persons(qid) ON DELETE SET NULL,
  FOREIGN KEY (override_id) REFERENCES validation_overrides(id) ON DELETE SET NULL
);

CREATE INDEX idx_guesses_session_sequence
ON game_guesses(game_session_id, sequence_number);
CREATE INDEX idx_guesses_normalized_status
ON game_guesses(normalized_input, status);
CREATE INDEX idx_guesses_person_status
ON game_guesses(person_qid, status);
CREATE INDEX idx_guesses_submitted
ON game_guesses(submitted_at DESC);
CREATE UNIQUE INDEX uq_session_accepted_qid
ON game_guesses(game_session_id, person_qid)
WHERE status = 'ACCEPTED' AND person_qid IS NOT NULL;

CREATE TABLE external_api_calls (
  id TEXT PRIMARY KEY NOT NULL,
  guess_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('wikipedia','wikidata')),
  operation TEXT NOT NULL,
  success INTEGER NOT NULL CHECK (success IN (0,1)),
  status_code INTEGER,
  duration_ms INTEGER NOT NULL,
  error_code TEXT,
  requested_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (guess_id) REFERENCES game_guesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_external_guess_provider
ON external_api_calls(guess_id, provider);
CREATE INDEX idx_external_provider_requested
ON external_api_calls(provider, requested_at DESC);
