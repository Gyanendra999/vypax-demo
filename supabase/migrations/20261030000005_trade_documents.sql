-- ==============================================================================
-- VYAAPX MIGRATION 05: TRADE DOCUMENTS, VERSIONING & COMPLIANCE VERIFICATION
-- Description: Export trade documents, version history, customs verification records,
--              and private multi-tenant file storage security policies.
-- ==============================================================================

-- 1. Trade Documents Table
CREATE TABLE IF NOT EXISTS public.trade_documents (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (name IN (
        'Commercial Invoice',
        'Packing List',
        'Shipping Bill',
        'Certificate of Origin',
        'Bill of Lading',
        'Dangerous Goods Declaration',
        'Letter of Credit'
    )),
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT DEFAULT 'application/pdf',
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
        'Missing',
        'Draft',
        'Under Review',
        'Verified'
    )),
    required_for TEXT NOT NULL DEFAULT 'Customs Clearance' CHECK (required_for IN (
        'Booking',
        'Customs Clearance',
        'Vessel Loading',
        'Delivery'
    )),
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    reference_number TEXT,
    notes TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    storage_bucket TEXT NOT NULL DEFAULT 'trade-documents',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace ON public.trade_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_shipment ON public.trade_documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.trade_documents(workspace_id, status);

DROP TRIGGER IF EXISTS trg_trade_documents_updated_at ON public.trade_documents;
CREATE TRIGGER trg_trade_documents_updated_at
    BEFORE UPDATE ON public.trade_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Document Versions (Audit trail of file revisions)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL REFERENCES public.trade_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON public.document_versions(document_id, version_number DESC);

-- 3. Document Compliance Approvals & Verifications
CREATE TABLE IF NOT EXISTS public.document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL REFERENCES public.trade_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'requested_changes')),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_approvals_document ON public.document_approvals(document_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR TRADE DOCUMENTS & VERSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.trade_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view documents for shipments in their workspace
CREATE POLICY "Tenant isolation for viewing documents"
    ON public.trade_documents
    FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- 2. INSERT: Operations, Documentation Managers, Admins, and Owners
CREATE POLICY "Authorized roles can create/upload documents"
    ON public.trade_documents
    FOR INSERT
    WITH CHECK (
        public.has_workspace_role(
            workspace_id,
            'documentation_manager',
            'operations_manager',
            'operations_executive',
            'compliance_officer',
            'admin',
            'owner',
            'super_admin'
        )
    );

-- 3. UPDATE / VERIFY: Compliance officers and documentation managers can update/verify
CREATE POLICY "Authorized roles can update and verify documents"
    ON public.trade_documents
    FOR UPDATE
    USING (
        public.has_workspace_role(
            workspace_id,
            'documentation_manager',
            'operations_manager',
            'compliance_officer',
            'admin',
            'owner',
            'super_admin'
        )
    )
    WITH CHECK (
        public.has_workspace_role(
            workspace_id,
            'documentation_manager',
            'operations_manager',
            'compliance_officer',
            'admin',
            'owner',
            'super_admin'
        )
    );

-- 4. DELETE: Only Company Admins and Owners
CREATE POLICY "Admins can delete trade documents"
    ON public.trade_documents
    FOR DELETE
    USING (public.has_workspace_role(workspace_id, 'admin', 'owner', 'super_admin'));

-- Document Versions RLS:
CREATE POLICY "Members can view document versions"
    ON public.document_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trade_documents doc
            WHERE doc.id = public.document_versions.document_id
              AND public.is_workspace_member(doc.workspace_id)
        )
    );

CREATE POLICY "Authorized roles can upload document versions"
    ON public.document_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trade_documents doc
            WHERE doc.id = public.document_versions.document_id
              AND public.has_workspace_role(
                  doc.workspace_id,
                  'documentation_manager',
                  'operations_manager',
                  'operations_executive',
                  'admin',
                  'owner',
                  'super_admin'
              )
        )
    );

-- Document Approvals RLS:
CREATE POLICY "Members can view document approvals"
    ON public.document_approvals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trade_documents doc
            WHERE doc.id = public.document_approvals.document_id
              AND public.is_workspace_member(doc.workspace_id)
        )
    );

CREATE POLICY "Compliance officers can register document approvals"
    ON public.document_approvals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trade_documents doc
            WHERE doc.id = public.document_approvals.document_id
              AND public.has_workspace_role(
                  doc.workspace_id,
                  'compliance_officer',
                  'documentation_manager',
                  'admin',
                  'owner',
                  'super_admin'
              )
        )
    );
