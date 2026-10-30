-- ==============================================================================
-- VYAAPX MIGRATION 01: USERS & AUTHENTICATION PROFILES
-- Description: Core user identity, security profiles, authentication methods,
--              MFA secrets, and login activity logs.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function to auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Core Users & Profiles Table
-- Integrates with Supabase auth.users or acts as standalone identity record
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    suspension_reason TEXT,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    mfa_backup_codes TEXT[],
    last_login_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for fast email lookups and active user status
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active) WHERE is_active = true;

-- Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Authentication Identities (Google, Microsoft, SAML SSO, Email, OTP)
CREATE TABLE IF NOT EXISTS public.auth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('email', 'google', 'microsoft', 'saml_sso', 'magic_link', 'phone_otp', 'email_otp')),
    provider_user_id TEXT NOT NULL,
    email TEXT,
    identity_data JSONB DEFAULT '{}'::jsonb,
    last_sign_in_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provider_identity UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON public.auth_identities(user_id);

-- 5. User Login & Access Auditing
CREATE TABLE IF NOT EXISTS public.login_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_activities_user ON public.login_activities(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR USERS & IDENTITIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activities ENABLE ROW LEVEL SECURITY;

-- Helper to safely get current authenticated user ID (works in Supabase or custom JWT session)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID,
        auth.uid()
    );
EXCEPTION WHEN OTHERS THEN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Users RLS: Users can view and manage their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (id = current_user_id());

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (id = current_user_id())
    WITH CHECK (id = current_user_id());

-- Allow initial profile insertion during registration
CREATE POLICY "Allow user registration insert"
    ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Auth Identities RLS: Users can view their linked credentials
CREATE POLICY "Users can view own auth identities"
    ON public.auth_identities
    FOR SELECT
    USING (user_id = current_user_id());

-- Login Activities RLS: Users can read their own login history
CREATE POLICY "Users can view own login activity"
    ON public.login_activities
    FOR SELECT
    USING (user_id = current_user_id());
