-- ==============================================================================
-- VYAAPX MIGRATION 06: MULTI-TENANT RLS POLICIES, STORAGE & BASELINE SEED
-- Description: Airtight tenant isolation enforcement, Supabase Storage bucket
--              security rules, and development baseline seeds.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FORCE ROW LEVEL SECURITY ON ALL TENANT-OWNED TABLES
-- ------------------------------------------------------------------------------
-- Force RLS ensures even table owners/roles with BYPASSRLS limitations
-- are subjected to multi-tenant isolation rules.
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.shipments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_milestones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_exceptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trade_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. SUPABASE STORAGE BUCKET ISOLATION (TRADE-DOCUMENTS)
-- ------------------------------------------------------------------------------
-- Ensure the private bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trade-documents',
    'trade-documents',
    false, -- Private bucket: Requires signed URL or JWT token
    26214400, -- 25MB maximum document limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400;

-- Storage Path Convention: `<workspace_id>/<shipment_id>/<filename>`
-- Helper function to extract workspace_id from storage object name
CREATE OR REPLACE FUNCTION storage_path_workspace_id(object_name TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (split_part(object_name, '/', 1))::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Storage Object Policies for 'trade-documents'
DROP POLICY IF EXISTS "Tenant isolation for downloading trade documents" ON storage.objects;
CREATE POLICY "Tenant isolation for downloading trade documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'trade-documents'
        AND public.is_workspace_member(storage_path_workspace_id(name))
    );

DROP POLICY IF EXISTS "Tenant isolation for uploading trade documents" ON storage.objects;
CREATE POLICY "Tenant isolation for uploading trade documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'trade-documents'
        AND public.has_workspace_role(
            storage_path_workspace_id(name),
            'documentation_manager',
            'operations_manager',
            'operations_executive',
            'admin',
            'owner',
            'super_admin'
        )
    );

-- ------------------------------------------------------------------------------
-- 3. BASELINE SEED DATA
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_company_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_workspace_id UUID := 'b0000000-0000-0000-0000-000000000001';
    v_dubai_ws_id UUID := 'b0000000-0000-0000-0000-000000000002';
    v_user_aarav UUID := 'c0000000-0000-0000-0000-000000000001';
    v_user_admin UUID := 'c0000000-0000-0000-0000-000000000002';
    v_user_compliance UUID := 'c0000000-0000-0000-0000-000000000003';
BEGIN
    -- Seed Primary Exporter Company
    INSERT INTO public.companies (
        id, name, code, iec_number, ad_code, gstin, port_registration, default_currency, default_incoterm
    ) VALUES (
        v_company_id,
        'Meridian Exports Pvt. Ltd.',
        'IN-MER-9402',
        '0309118420',
        '0281940-001',
        '27AABCM9102L1ZQ',
        'INNSA1 (Nhava Sheva Sea)',
        'USD',
        'CIF - Cost, Insurance and Freight'
    ) ON CONFLICT (code) DO NOTHING;

    -- Seed Workspaces
    INSERT INTO public.workspaces (
        id, company_id, name, slug, description
    ) VALUES (
        v_workspace_id,
        v_company_id,
        'Primary Export Operations',
        'meridian-exports-primary',
        'Primary international trade, customs filing, and freight operations desk.'
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.workspaces (
        id, company_id, name, slug, description
    ) VALUES (
        v_dubai_ws_id,
        v_company_id,
        'Gulf Region Operations (Jebel Ali CFS)',
        'meridian-dubai-hub',
        'Middle East regional distribution and warehousing workspace.'
    ) ON CONFLICT (slug) DO NOTHING;

    -- Seed Baseline Core Users
    INSERT INTO public.users (
        id, email, full_name, phone, email_verified, is_active
    ) VALUES
    (
        v_user_aarav,
        'aarav.m@meridianexports.in',
        'Aarav Mehta',
        '+91 98200 12345',
        true,
        true
    ),
    (
        v_user_admin,
        'admin@vyaapx.com',
        'Vikram Singhania',
        '+1 415 555 0192',
        true,
        true
    ),
    (
        v_user_compliance,
        'compliance@meridianexports.in',
        'Priya Nambiar',
        '+91 98400 54321',
        true,
        true
    ) ON CONFLICT (email) DO NOTHING;

    -- Seed Workspace Memberships with Granular Roles
    INSERT INTO public.workspace_memberships (
        workspace_id, user_id, role, title, department
    ) VALUES
    (
        v_workspace_id,
        v_user_aarav,
        'operations_manager',
        'Operations Manager',
        'Export Logistics & Compliance'
    ),
    (
        v_workspace_id,
        v_user_admin,
        'super_admin',
        'Global Platform Administrator',
        'Executive Governance'
    ),
    (
        v_workspace_id,
        v_user_compliance,
        'compliance_officer',
        'Chief Customs & Compliance Lead',
        'Legal & Regulatory Affairs'
    ),
    (
        v_dubai_ws_id,
        v_user_aarav,
        'operations_manager',
        'Regional Logistics Coordinator',
        'Gulf Distribution'
    ) ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Seed Baseline Shipment
    INSERT INTO public.shipments (
        id, workspace_id, title,
        origin_city, origin_country, origin_port, origin_code,
        dest_city, dest_country, dest_port, dest_code,
        cargo_description, category, hs_code, quantity, unit,
        gross_weight_kg, volume_cbm, container_type, package_count,
        declared_value_usd, freight_cost_usd, insurance_cost_usd, estimated_duty_usd, other_charges_usd, target_revenue_usd,
        status, carrier_or_forwarder, vessel_name, voyage_number, booking_reference,
        eta, etd, owner, assigned_to
    ) VALUES (
        'VPX-24017',
        v_workspace_id,
        'Precision Engineering Assemblies - UAE Consignment',
        'Mumbai', 'India', 'Nhava Sheva (JNPT)', 'INNSA',
        'Dubai', 'United Arab Emirates', 'Jebel Ali Port', 'AEJEA',
        'Industrial pump shafts and precision coupling flanges', 'Engineering Components', '8483.40.00', 500, 'Units',
        4250, 14.8, '20FT Standard', 12,
        21000, 1250, 180, 1121, 350, 32000,
        'In Transit', 'HarborLink Logistics', 'MV Arabian Bridge', 'AB-2609', 'HL-BK-99120',
        'Oct 04, 2026', 'Sep 27, 2026', 'Aarav', 'Aarav Mehta'
    ) ON CONFLICT (id) DO NOTHING;

    -- Seed Baseline Documents
    INSERT INTO public.trade_documents (
        id, workspace_id, shipment_id, name, file_name, status, required_for, verified_by, reference_number
    ) VALUES
    (
        'doc-seed-1',
        v_workspace_id,
        'VPX-24017',
        'Commercial Invoice',
        'Commercial_Invoice_VPX-24017.pdf',
        'Verified',
        'Customs Clearance',
        'Global Verification Desk',
        'INV/EXP/26/24017'
    ),
    (
        'doc-seed-2',
        v_workspace_id,
        'VPX-24017',
        'Packing List',
        'Packing_List_VPX-24017.pdf',
        'Verified',
        'Customs Clearance',
        'CFS Staging Officer',
        'PKL/26/24017'
    ),
    (
        'doc-seed-3',
        v_workspace_id,
        'VPX-24017',
        'Certificate of Origin',
        'Certificate_of_Origin_VPX-24017.pdf',
        'Verified',
        'Customs Clearance',
        'JNPT Chamber of Commerce',
        'CEPA/IN/AE/2026/894'
    ),
    (
        'doc-seed-4',
        v_workspace_id,
        'VPX-24017',
        'Bill of Lading',
        'Bill_of_Lading_VPX-24017.pdf',
        'Under Review',
        'Delivery',
        NULL,
        'HBL-991204-JNPT'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
