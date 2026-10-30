-- ==============================================================================
-- VYAAPX INTERNATIONAL TRADE OPERATING PLATFORM
-- PRODUCTION SUPABASE POSTGRESQL SCHEMA WITH RLS & SEED DATA
-- ==============================================================================

-- Enable UUID and Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. COMPANIES & WORKSPACES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    iec_number TEXT,
    ad_code TEXT,
    gstin TEXT,
    port_registration TEXT,
    default_currency TEXT DEFAULT 'USD',
    default_incoterm TEXT DEFAULT 'CIF - Cost, Insurance and Freight',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. USERS, PROFILES & AUTH IDENTITIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,
    mfa_backup_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'email', 'google', 'microsoft', 'saml_sso', 'magic_link', 'otp'
    provider_user_id TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS login_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    location TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. WORKSPACE MEMBERSHIPS & INVITATIONS (RBAC)
-- ------------------------------------------------------------------------------
-- Supported Roles:
-- 'super_admin', 'owner', 'admin', 'operations_manager', 'operations_executive',
-- 'documentation_manager', 'finance_manager', 'sales_manager', 'compliance_officer',
-- 'viewer', 'external_partner'

CREATE TABLE IF NOT EXISTS workspace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    title TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    token TEXT NOT NULL UNIQUE,
    inviter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'revoked'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SHIPMENTS, MILESTONES & EXCEPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY, -- e.g. 'VPX-24017'
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    origin_city TEXT NOT NULL,
    origin_country TEXT NOT NULL,
    origin_port TEXT NOT NULL,
    origin_code TEXT NOT NULL,
    dest_city TEXT NOT NULL,
    dest_country TEXT NOT NULL,
    dest_port TEXT NOT NULL,
    dest_code TEXT NOT NULL,
    cargo_description TEXT NOT NULL,
    category TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Units',
    gross_weight_kg NUMERIC NOT NULL DEFAULT 0,
    volume_cbm NUMERIC NOT NULL DEFAULT 0,
    container_type TEXT NOT NULL,
    package_count INTEGER NOT NULL DEFAULT 1,
    declared_value_usd NUMERIC NOT NULL DEFAULT 0,
    freight_cost_usd NUMERIC NOT NULL DEFAULT 0,
    insurance_cost_usd NUMERIC NOT NULL DEFAULT 0,
    estimated_duty_usd NUMERIC NOT NULL DEFAULT 0,
    other_charges_usd NUMERIC NOT NULL DEFAULT 0,
    target_revenue_usd NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'Preparing',
    carrier_or_forwarder TEXT NOT NULL,
    vessel_name TEXT,
    voyage_number TEXT,
    booking_reference TEXT,
    eta TEXT NOT NULL,
    etd TEXT NOT NULL,
    owner TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    exception_note TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    milestone_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'completed', 'in_progress', 'pending'
    timestamp TEXT,
    location TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. TRADE DOCUMENTS & VERSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_documents (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Missing', 'Draft', 'Under Review', 'Verified'
    required_for TEXT NOT NULL DEFAULT 'Customs Clearance',
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    reference_number TEXT,
    notes TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    storage_bucket TEXT DEFAULT 'trade-documents',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL REFERENCES trade_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL REFERENCES trade_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'approved', 'rejected', 'requested_changes'
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TRADE OPPORTUNITIES & CORRIDORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_opportunities (
    id TEXT PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    indicative_margin_min NUMERIC NOT NULL,
    indicative_margin_max NUMERIC NOT NULL,
    demand_level TEXT NOT NULL DEFAULT 'Steady',
    avg_freight_estimate NUMERIC NOT NULL,
    typical_tariff_rate TEXT NOT NULL,
    overview TEXT NOT NULL,
    key_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. LOGISTICS PARTNERS & CONTACTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics_partners (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    coverage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    rating TEXT NOT NULL DEFAULT '4.8',
    contact_person TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    notes TEXT,
    active_shipment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id TEXT NOT NULL REFERENCES logistics_partners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT
);

-- ------------------------------------------------------------------------------
-- 8. LANDED COST CALCULATIONS (DECIMAL-SAFE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landed_cost_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    quantity NUMERIC(16,4) NOT NULL,
    unit_price NUMERIC(16,4) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    freight_cost NUMERIC(16,4) NOT NULL DEFAULT 0,
    insurance_cost NUMERIC(16,4) NOT NULL DEFAULT 0,
    duty_rate_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
    customs_cess_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
    other_port_charges NUMERIC(16,4) NOT NULL DEFAULT 0,
    target_selling_price_per_unit NUMERIC(16,4) NOT NULL DEFAULT 0,
    
    product_value NUMERIC(16,4) NOT NULL,
    duty_amount NUMERIC(16,4) NOT NULL,
    cess_amount NUMERIC(16,4) NOT NULL,
    total_duty_and_taxes NUMERIC(16,4) NOT NULL,
    total_landed_cost NUMERIC(16,4) NOT NULL,
    cost_per_unit NUMERIC(16,4) NOT NULL,
    expected_revenue NUMERIC(16,4) NOT NULL,
    estimated_gross_margin_usd NUMERIC(16,4) NOT NULL,
    estimated_gross_margin_percent NUMERIC(8,4) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. ACTIVITY FEED & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    shipment_id TEXT,
    type TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_email TEXT,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. NOTIFICATIONS & PREFERENCES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    delivery_status TEXT DEFAULT 'delivered',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    shipment_status_enabled BOOLEAN DEFAULT true,
    exception_alerts_enabled BOOLEAN DEFAULT true,
    document_alerts_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shipments_workspace ON shipments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_documents_shipment ON trade_documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON trade_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activity_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON workspace_memberships(workspace_id);

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE landed_cost_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper check for workspace tenant membership:
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspace Isolation Policies
CREATE POLICY "Users can access their workspaces"
    ON workspaces FOR ALL
    USING (is_workspace_member(id));

CREATE POLICY "Workspace shipments tenant isolation"
    ON shipments FOR ALL
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace trade documents tenant isolation"
    ON trade_documents FOR ALL
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace partners tenant isolation"
    ON logistics_partners FOR ALL
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace landed calculations tenant isolation"
    ON landed_cost_calculations FOR ALL
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace activities tenant isolation"
    ON activity_events FOR ALL
    USING (is_workspace_member(workspace_id));

CREATE POLICY "User notifications isolation"
    ON notifications FOR ALL
    USING (user_id = auth.uid());
