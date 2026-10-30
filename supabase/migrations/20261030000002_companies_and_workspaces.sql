-- ==============================================================================
-- VYAAPX MIGRATION 02: COMPANIES & MULTI-TENANT WORKSPACES
-- Description: Exporter enterprise entities, legal trade identifiers,
--              and isolated operational workspaces.
-- ==============================================================================

-- 1. Companies Table (Parent Tenant Entity)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- e.g. 'IN-MER-9402'
    iec_number TEXT,           -- Importer-Exporter Code
    ad_code TEXT,              -- Authorized Dealer Code for FX remittance
    gstin TEXT,                -- Tax Identification Number
    port_registration TEXT,    -- Primary registered customs gateway (e.g. 'INNSA1 (Nhava Sheva Sea)')
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    default_incoterm TEXT NOT NULL DEFAULT 'CIF - Cost, Insurance and Freight',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_currency_format CHECK (default_currency ~ '^[A-Z]{3}$')
);

CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Workspaces Table (Isolated Operational Workspace under a Company)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "requireTwoFactor": false,
        "notificationDigest": "realtime",
        "restrictedHSChapters": []
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_company ON public.workspaces(company_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR COMPANIES & WORKSPACES
-- ------------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Note: Policies leverage workspace memberships defined in Migration 03.
-- Direct creation policy: authenticated users can create companies & workspaces.
CREATE POLICY "Authenticated users can create companies"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can create workspaces"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
