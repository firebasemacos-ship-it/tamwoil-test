-- Create app_settings table for controlling app features
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT REFERENCES users_v4(id)
);

-- Insert initial setting for store visibility
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES ('store_enabled', 'true', 'تحكم في ظهور قسم المتجر في التطبيق')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
-- This might fail if already added, so strictly speaking we could wrap it, but it's usually fine or we can ignore
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;

-- Policy: Allow everyone to read settings
DROP POLICY IF EXISTS "Enable read access for all users" ON app_settings;
CREATE POLICY "Enable read access for all users"
ON app_settings FOR SELECT
USING (true);

-- Policy: Only admins can update settings
DROP POLICY IF EXISTS "Enable update for admins only" ON app_settings;
CREATE POLICY "Enable update for admins only"
ON app_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM managers_v4
    WHERE managers_v4.id = auth.uid()::text
  )
);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
