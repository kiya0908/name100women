interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  APP_URL: string;
  APP_ENV: string;
  ANONYMOUS_HASH_SALT?: string;
  IP_HASH_SALT?: string;
  GA4_ID?: string;
  CLARITY_ID?: string;
}
