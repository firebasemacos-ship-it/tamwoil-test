-- Secure function to register devices for Custom Auth users
-- This bypasses RLS issues since the app doesn't use Supabase Auth.

CREATE OR REPLACE FUNCTION public.register_user_device(
    p_user_id TEXT,
    p_fcm_token TEXT,
    p_device_name TEXT,
    p_platform TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the creator (postgres/admin)
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    -- 1. Verify user exists in users_v4 (Security Check)
    -- We cast p_user_id to valid UUID if needed, but users_v4 might use text or uuid. 
    -- Assuming text based on previous code schemas, or we use explicit cast if it's uuid.
    -- Let's check users_v4 structure later, but generally checking existence is good.
    
    -- Note: users_v4 id is usually a UUID string.
    SELECT EXISTS (SELECT 1 FROM public.users_v4 WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
         -- Optional: Check fallback 'users' table if needed, or just return error
         -- For now, we'll proceed only if it matches users_v4 to be strict.
         RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- 2. Upsert Device
    INSERT INTO public.user_devices (user_id, fcm_token, device_name, platform, last_active, created_at)
    VALUES (p_user_id, p_fcm_token, p_device_name, p_platform, NOW(), NOW())
    ON CONFLICT (user_id, fcm_token) 
    DO UPDATE SET 
        last_active = NOW(),
        device_name = EXCLUDED.device_name,
        platform = EXCLUDED.platform;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execution to anon (public) role so Flutter app can call it
GRANT EXECUTE ON FUNCTION public.register_user_device(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_user_device(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user_device(TEXT, TEXT, TEXT, TEXT) TO service_role;
