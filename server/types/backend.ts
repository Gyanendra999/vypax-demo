export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'operations_manager'
  | 'operations_executive'
  | 'documentation_manager'
  | 'finance_manager'
  | 'sales_manager'
  | 'compliance_officer'
  | 'viewer'
  | 'external_partner';

export type Permission =
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'members:manage'
  | 'members:invite'
  | 'shipments:read'
  | 'shipments:create'
  | 'shipments:update'
  | 'shipments:delete'
  | 'shipments:assign'
  | 'documents:read'
  | 'documents:upload'
  | 'documents:verify'
  | 'documents:delete'
  | 'calculator:execute'
  | 'calculator:export'
  | 'partners:read'
  | 'partners:manage'
  | 'opportunities:read'
  | 'opportunities:manage'
  | 'audit:read'
  | 'settings:manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'members:manage',
    'members:invite',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'shipments:delete',
    'shipments:assign',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'documents:delete',
    'calculator:execute',
    'calculator:export',
    'partners:read',
    'partners:manage',
    'opportunities:read',
    'opportunities:manage',
    'audit:read',
    'settings:manage',
  ],
  owner: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'members:manage',
    'members:invite',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'shipments:delete',
    'shipments:assign',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'documents:delete',
    'calculator:execute',
    'calculator:export',
    'partners:read',
    'partners:manage',
    'opportunities:read',
    'opportunities:manage',
    'audit:read',
    'settings:manage',
  ],
  admin: [
    'workspace:read',
    'workspace:update',
    'members:manage',
    'members:invite',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'shipments:delete',
    'shipments:assign',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'calculator:execute',
    'calculator:export',
    'partners:read',
    'partners:manage',
    'opportunities:read',
    'opportunities:manage',
    'audit:read',
    'settings:manage',
  ],
  operations_manager: [
    'workspace:read',
    'members:invite',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'shipments:assign',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'calculator:execute',
    'calculator:export',
    'partners:read',
    'partners:manage',
    'opportunities:read',
    'audit:read',
  ],
  operations_executive: [
    'workspace:read',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'documents:read',
    'documents:upload',
    'calculator:execute',
    'partners:read',
    'opportunities:read',
  ],
  documentation_manager: [
    'workspace:read',
    'shipments:read',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'documents:delete',
    'calculator:execute',
  ],
  finance_manager: [
    'workspace:read',
    'shipments:read',
    'documents:read',
    'calculator:execute',
    'calculator:export',
    'opportunities:read',
  ],
  sales_manager: [
    'workspace:read',
    'shipments:read',
    'opportunities:read',
    'opportunities:manage',
    'calculator:execute',
    'calculator:export',
  ],
  compliance_officer: [
    'workspace:read',
    'shipments:read',
    'documents:read',
    'documents:verify',
    'audit:read',
  ],
  viewer: [
    'workspace:read',
    'shipments:read',
    'documents:read',
    'partners:read',
    'opportunities:read',
    'calculator:execute',
  ],
  external_partner: [
    'workspace:read',
    'shipments:read',
    'documents:read',
    'documents:upload',
  ],
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  createdAt: string;
}

export interface WorkspaceRecord {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  code: string;
  iecNumber: string;
  adCode: string;
  gstin: string;
  portRegistration: string;
  defaultCurrency: string;
  defaultIncoterm: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipRecord {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  title: string;
  department: string;
  isActive: boolean;
  joinedAt: string;
}

export interface InvitationRecord {
  id: string;
  workspaceId: string;
  email: string;
  role: UserRole;
  token: string;
  inviterId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}
