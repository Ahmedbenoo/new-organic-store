UPDATE site_settings
SET value = '201092313486', updated_at = NOW()
WHERE key IN ('whatsapp_owner', 'whatsapp_branch');

INSERT INTO site_settings (key, value, category, updated_at)
VALUES
  ('whatsapp_owner', '201092313486', 'contact', NOW()),
  ('whatsapp_branch', '201092313486', 'contact', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
