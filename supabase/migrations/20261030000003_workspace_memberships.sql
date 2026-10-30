-- ==============================================================================
-- VYAAPX MIGRATION 03: WORKSPACE MEMBERSHIPS & GRANULAR RBAC
-- Description: Multi-role memberships, email-based workspace invitations,
--              and tenant boundary security functions.
-- ==============================================================================

-- 1. Workspace Memberships Table
CREATE TABLE IF NOT EXISTS public.workspace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN (
        'super_admin',
        'owner',
        'admin',
        'operations_manager',
        'operations_executive',
        'documentation_manager',
        'finance_manager',
        'sales_manager',
        'compliance_officer',
        'viewer',
        'external_partner'
    )),
    title TEXT,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_user UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON public.workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.workspace_memberships(workspace_id, role);

-- 2. Workspace Invitations Table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN (
        'super_admin',
        'owner',
        'admin',
        'operations_manager',
        'operations_executive',
        'documentation_manager',
        'finance_manager',
        'sales_manager',
        'compliance_officer',
        'viewer',
        'external_partner'
    )),
    token TEXT NOT NULL UNIQUE,
    inviter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.workspace_invitations(email);

-- ------------------------------------------------------------------------------
-- TENANT BOUNDARY & AUTHORIZATION FUNCTIONS (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Helper: Check if current authenticated user has active membership in workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_memberships
        WHERE workspace_id = ws_id
          AND user_id = current_user_id()
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Get current user's role in a specific workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(ws_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.workspace_memberships
    WHERE workspace_id = ws_id
      AND user_id = current_user_id()
      AND is_active = true
    LIMIT 1;

    RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Check if user has one of the required administrative roles
CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_memberships
        WHERE workspace_id = ws_id
          AND user_id = current_user_id()
          AND is_active = true
          AND (role = ANY(allowed_roles) OR role IN ('super_admin', 'owner'))
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR MEMBERSHIPS & INVITATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Workspace Memberships RLS:
-- Members can view team members in the same workspace
CREATE POLICY "Members can view workspace peers"
    ON public.workspace_memberships
    FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- Owners, Admins, or Super Admins can insert/update memberships
CREATE POLICY "Admins can manage workspace memberships"
    ON public.workspace_memberships
    FOR ALL
    USING (public.has_workspace_role(workspace_id, 'admin', 'owner', 'super_admin'))
    WITH CHECK (public.has_workspace_role(workspace_id, 'admin', 'owner', 'super_admin'));

-- Workspace Invitations RLS:
CREATE POLICY "Members can view workspace invitations"
    ON public.workspace_invitations
    FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can create invitations"
    ON public.workspace_invitations
    FOR INSERT
    WITH CHECK (public.has_workspace_role(workspace_id, 'admin', 'owner', 'operations_manager', 'super_admin'));

-- Now apply tenant isolation policies to Workspaces and Companies
CREATE POLICY "Users can view workspaces they belong to"
    ON public.workspaces
    FOR SELECT
    USING (public.is_workspace_member(id));

CREATE POLICY "Admins can update workspace settings"
    ON public.workspaces
    FOR UPDATE
    USING (public.has_workspace_role(id, 'admin', 'owner', 'super_admin'))
    WITH CHECK (public.has_workspace_role(id, 'admin', 'owner', 'super_admin'));

CREATE POLICY "Users can view companies of their workspaces"
    ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces ws
            JOIN public.workspace_memberships mem ON mem.workspace_id = ws.id
            WHERE ws.company_id = public.companies.id
              AND mem.user_id = current_user_id()
              AND mem.is_active = true
        )
    );

CREATE POLICY "Company owners can update company profile"
    ON public.companies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces ws
            JOIN public.workspace_memberships mem ON mem.workspace_id = ws.id
            WHERE ws.company_id = public.companies.id
              AND mem.user_id = current_user_id()
              AND mem.role IN ('owner', 'super_admin')
              AND mem.is_active = true
        )
    );
