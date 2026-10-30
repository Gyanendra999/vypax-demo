# VYAAPX Database Migrations & Tenant Isolation Architecture

This directory contains the production-grade PostgreSQL / Supabase SQL migrations for VYAAPX.

## Migration Sequence

Execute the migrations in sequential order:

1. **`20261030000001_users_and_profiles.sql`**:
   - Extensions: `uuid-ossp`, `pgcrypto`.
   - Core tables: `users`, `auth_identities`, `login_activities`.
   - Automatic `updated_at` triggers.
   - User profile self-management RLS policies.

2. **`20261030000002_companies_and_workspaces.sql`**:
   - Core tables: `companies` (legal exporter entity, IEC, GSTIN, AD code), `workspaces` (isolated operational workspaces).
   - Foreign keys with cascading lifecycle rules.

3. **`20261030000003_workspace_memberships.sql`**:
   - Core tables: `workspace_memberships`, `workspace_invitations`.
   - Granular RBAC supporting all 11 roles (`super_admin`, `owner`, `admin`, `operations_manager`, `operations_executive`, `documentation_manager`, `finance_manager`, `sales_manager`, `compliance_officer`, `viewer`, `external_partner`).
   - Security functions: `is_workspace_member(ws_id)`, `get_user_workspace_role(ws_id)`, `has_workspace_role(ws_id, allowed_roles)`.
   - Tenant isolation policies for company and workspace access.

4. **`20261030000004_shipments_and_milestones.sql`**:
   - Core tables: `shipments`, `shipment_milestones`, `shipment_exceptions`.
   - Multi-tenant isolation: Members can only read consignments for their workspace (`is_workspace_member(workspace_id)`).
   - Role-based mutation: Viewers are read-only; operations desk & managers execute updates.

5. **`20261030000005_trade_documents.sql`**:
   - Core tables: `trade_documents`, `document_versions`, `document_approvals`.
   - Customs document verification authorization: Only compliance officers and documentation managers can mark documents as `Verified`.

6. **`20261030000006_rls_multi_tenant_policies.sql`**:
   - `FORCE ROW LEVEL SECURITY` across all tenant entities.
   - Private Supabase Storage bucket (`trade-documents`) configuration.
   - Object-level security policies enforcing `<workspace_id>/<shipment_id>/<file>` path isolation.
   - Baseline seed data for primary export operations (`Meridian Exports Pvt. Ltd.`, `VPX-24017`).

---

## Applying Migrations

### Via Supabase CLI
```bash
supabase db reset
# or to apply to remote:
supabase db push
```

### Via Supabase Web Dashboard
1. Open your project on **https://supabase.com/dashboard**.
2. Navigate to the **SQL Editor**.
3. Open and run the migration files in numerical order (01 through 06).
