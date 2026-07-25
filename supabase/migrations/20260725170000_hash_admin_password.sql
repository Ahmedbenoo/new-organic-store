-- Hash any legacy plain-text admin_password values with bcrypt (pgcrypto).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE site_settings
SET
  value = crypt(value, gen_salt('bf')),
  updated_at = NOW()
WHERE key = 'admin_password'
  AND value IS NOT NULL
  AND value !~ '^\$2[aby]\$\d{2}\$';

NOTIFY pgrst, 'reload schema';
