-- ==============================================================================
-- VYAAPX MIGRATION 04: SHIPMENTS, MILESTONES & OPERATIONAL EXCEPTIONS
-- Description: Core international trade consignments, milestone progressions,
--              freight tracking events, and multi-tenant isolation policies.
-- ==============================================================================

-- 1. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id TEXT PRIMARY KEY, -- e.g. 'VPX-24017'
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    
    -- Origin Gateway
    origin_city TEXT NOT NULL,
    origin_country TEXT NOT NULL,
    origin_port TEXT NOT NULL,
    origin_code TEXT NOT NULL,
    
    -- Destination Gateway
    dest_city TEXT NOT NULL,
    dest_country TEXT NOT NULL,
    dest_port TEXT NOT NULL,
    dest_code TEXT NOT NULL,
    
    -- Cargo & Tariff Particulars
    cargo_description TEXT NOT NULL,
    category TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Units',
    gross_weight_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    volume_cbm NUMERIC(10,2) NOT NULL DEFAULT 0,
    container_type TEXT NOT NULL CHECK (container_type IN ('20FT Standard', '40FT High Cube', 'LCL Consolidation', 'Air Cargo')),
    package_count INTEGER NOT NULL DEFAULT 1,
    
    -- Financials (USD standard basis)
    declared_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    freight_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    insurance_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    estimated_duty_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_charges_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    target_revenue_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Operational Status
    status TEXT NOT NULL DEFAULT 'Preparing' CHECK (status IN (
        'Draft',
        'Preparing',
        'Documentation',
        'Ready to Book',
        'Booked',
        'In Transit',
        'At Port',
        'Delivered',
        'Exception'
    )),
    
    -- Logistics Carriage
    carrier_or_forwarder TEXT NOT NULL,
    vessel_name TEXT,
    voyage_number TEXT,
    booking_reference TEXT,
    eta TEXT NOT NULL,
    etd TEXT NOT NULL,
    
    -- Ownership & Execution
    owner TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    exception_note TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast queries and tenant isolation
CREATE INDEX IF NOT EXISTS idx_shipments_workspace ON public.shipments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_hs_code ON public.shipments(hs_code);
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_to ON public.shipments(assigned_to);

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Shipment Milestones Table
CREATE TABLE IF NOT EXISTS public.shipment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    milestone_key TEXT NOT NULL, -- 'm1', 'm2', etc.
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'in_progress', 'pending')),
    timestamp TEXT,
    location TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_shipment ON public.shipment_milestones(shipment_id, sort_order ASC);

-- 3. Shipment Operational Exceptions
CREATE TABLE IF NOT EXISTS public.shipment_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. 'FEEDER_ROLLOVER', 'PORT_CONGESTION'
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exceptions_shipment ON public.shipment_exceptions(shipment_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR SHIPMENTS, MILESTONES & EXCEPTIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_exceptions ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Workspace members can only read shipments belonging to their workspace
CREATE POLICY "Tenant isolation for viewing shipments"
    ON public.shipments
    FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- 2. INSERT: Operations, Admins, and Owners can create shipments
CREATE POLICY "Authorized roles can create shipments"
    ON public.shipments
    FOR INSERT
    WITH CHECK (
        public.has_workspace_role(
            workspace_id,
            'operations_manager',
            'operations_executive',
            'documentation_manager',
            'admin',
            'owner',
            'super_admin'
        )
    );

-- 3. UPDATE: Authorized team members can update shipments
CREATE POLICY "Authorized roles can update shipments"
    ON public.shipments
    FOR UPDATE
    USING (
        public.has_workspace_role(
            workspace_id,
            'operations_manager',
            'operations_executive',
            'documentation_manager',
            'compliance_officer',
            'admin',
            'owner',
            'super_admin'
        )
    )
    WITH CHECK (
        public.has_workspace_role(
            workspace_id,
            'operations_manager',
            'operations_executive',
            'documentation_manager',
            'compliance_officer',
            'admin',
            'owner',
            'super_admin'
        )
    );

-- 4. DELETE / ARCHIVE: Only Company Admins, Owners, and Super Admins
CREATE POLICY "Admins can delete or archive shipments"
    ON public.shipments
    FOR DELETE
    USING (public.has_workspace_role(workspace_id, 'admin', 'owner', 'super_admin'));

-- Milestones RLS: inherits tenancy from shipment
CREATE POLICY "Members can view shipment milestones"
    ON public.shipment_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = public.shipment_milestones.shipment_id
              AND public.is_workspace_member(s.workspace_id)
        )
    );

CREATE POLICY "Operations can manage shipment milestones"
    ON public.shipment_milestones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = public.shipment_milestones.shipment_id
              AND public.has_workspace_role(
                  s.workspace_id,
                  'operations_manager',
                  'operations_executive',
                  'admin',
                  'owner',
                  'super_admin'
              )
        )
    );

-- Exceptions RLS:
CREATE POLICY "Members can view shipment exceptions"
    ON public.shipment_exceptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = public.shipment_exceptions.shipment_id
              AND public.is_workspace_member(s.workspace_id)
        )
    );

CREATE POLICY "Operations can manage shipment exceptions"
    ON public.shipment_exceptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = public.shipment_exceptions.shipment_id
              AND public.has_workspace_role(
                  s.workspace_id,
                  'operations_manager',
                  'operations_executive',
                  'compliance_officer',
                  'admin',
                  'owner',
                  'super_admin'
              )
        )
    );
