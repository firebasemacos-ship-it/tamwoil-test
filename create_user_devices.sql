-- Create user_devices table for multi-device support
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    fcm_token TEXT NOT NULL,
    device_name TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    platform TEXT, -- 'android', 'ios', 'web'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, fcm_token) -- Prevent duplicate tokens for the same user
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own devices
CREATE POLICY "Users can view their own devices" 
ON public.user_devices FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Policy: Allow users to insert their own devices
CREATE POLICY "Users can insert their own devices" 
ON public.user_devices FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Policy: Allow users to update their own devices
CREATE POLICY "Users can update their own devices" 
ON public.user_devices FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Policy: Allow users to delete their own devices
CREATE POLICY "Users can delete their own devices" 
ON public.user_devices FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Policy: Service Role has full access (for Edge Functions)
CREATE POLICY "Service Role has full access" 
ON public.user_devices FOR ALL 
USING (true) 
WITH CHECK (true);
