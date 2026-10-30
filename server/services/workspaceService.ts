import crypto from 'crypto';
import { db } from '../db/database';
import {
  WorkspaceRecord,
  CompanyRecord,
  MembershipRecord,
  InvitationRecord,
  UserRole,
} from '../types/backend';

export class WorkspaceService {
  // 1. Get user workspaces
  public getUserWorkspaces(userId: string): { workspace: WorkspaceRecord; role: UserRole; company: CompanyRecord }[] {
    const memberships = Array.from(db.memberships.values()).filter(
      (m) => m.userId === userId && m.isActive
    );

    return memberships
      .map((m) => {
        const workspace = db.workspaces.get(m.workspaceId);
        if (!workspace || !workspace.isActive) return null;
        const company = db.companies.get(workspace.companyId);
        if (!company) return null;
        return {
          workspace,
          role: m.role,
          company,
        };
      })
      .filter(Boolean) as { workspace: WorkspaceRecord; role: UserRole; company: CompanyRecord }[];
  }

  // 2. Get workspace details
  public getWorkspace(workspaceId: string): {
    workspace: WorkspaceRecord;
    company: CompanyRecord;
    members: (MembershipRecord & { user: { id: string; fullName: string; email: string; avatarUrl?: string } })[];
  } {
    const workspace = db.workspaces.get(workspaceId);
    if (!workspace) throw new Error('Workspace not found.');

    const company = db.companies.get(workspace.companyId);
    if (!company) throw new Error('Associated company not found.');

    const members = Array.from(db.memberships.values())
      .filter((m) => m.workspaceId === workspaceId && m.isActive)
      .map((m) => {
        const user = db.users.get(m.userId);
        return {
          ...m,
          user: {
            id: m.userId,
            fullName: user ? user.fullName : 'Workspace User',
            email: user ? user.email : 'user@domain.com',
            avatarUrl: user?.avatarUrl,
          },
        };
      });

    return { workspace, company, members };
  }

  // 3. Create workspace
  public createWorkspace(params: {
    companyId?: string;
    userId: string;
    name: string;
    description?: string;
  }): WorkspaceRecord {
    let companyId = params.companyId;

    if (!companyId) {
      // Find first company user owns or create one
      const existingMembership = Array.from(db.memberships.values()).find(
        (m) => m.userId === params.userId && (m.role === 'owner' || m.role === 'admin')
      );
      if (existingMembership) {
        const ws = db.workspaces.get(existingMembership.workspaceId);
        if (ws) companyId = ws.companyId;
      }

      if (!companyId) {
        companyId = `comp-${Date.now()}`;
        db.companies.set(companyId, {
          id: companyId,
          name: `${params.name} Enterprise`,
          code: `EXP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          iecNumber: 'PENDING',
          adCode: 'PENDING',
          gstin: 'PENDING',
          portRegistration: 'INNSA1',
          defaultCurrency: 'USD',
          defaultIncoterm: 'CIF - Cost, Insurance and Freight',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const wsId = `ws-${Date.now()}`;
    const newWs: WorkspaceRecord = {
      id: wsId,
      companyId: companyId!,
      name: params.name,
      slug: params.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
      description: params.description,
      settings: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.workspaces.set(wsId, newWs);

    // Make creator Owner
    db.memberships.set(`mem-${wsId}-${params.userId}`, {
      id: `mem-${wsId}-${params.userId}`,
      workspaceId: wsId,
      userId: params.userId,
      role: 'owner',
      title: 'Workspace Administrator',
      department: 'Management',
      isActive: true,
      joinedAt: new Date().toISOString(),
    });

    return newWs;
  }

  // 4. Update company settings
  public updateCompanySettings(
    companyId: string,
    updates: Partial<CompanyRecord>
  ): CompanyRecord {
    const company = db.companies.get(companyId);
    if (!company) throw new Error('Company not found.');

    const updated = {
      ...company,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.companies.set(companyId, updated);
    return updated;
  }

  // 5. Update workspace settings
  public updateWorkspaceSettings(
    workspaceId: string,
    updates: { name?: string; description?: string; settings?: Record<string, any> }
  ): WorkspaceRecord {
    const ws = db.workspaces.get(workspaceId);
    if (!ws) throw new Error('Workspace not found.');

    const updated = {
      ...ws,
      ...updates,
      settings: { ...ws.settings, ...updates.settings },
      updatedAt: new Date().toISOString(),
    };
    db.workspaces.set(workspaceId, updated);
    return updated;
  }

  // 6. Invite user to workspace
  public createInvitation(params: {
    workspaceId: string;
    inviterId: string;
    email: string;
    role: UserRole;
  }): InvitationRecord {
    const token = crypto.randomBytes(24).toString('hex');
    const inv: InvitationRecord = {
      id: `inv-${Date.now()}`,
      workspaceId: params.workspaceId,
      inviterId: params.inviterId,
      email: params.email.toLowerCase(),
      role: params.role,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.invitations.set(inv.id, inv);
    return inv;
  }

  // 7. Accept invitation
  public acceptInvitation(token: string, userId: string): MembershipRecord {
    const inv = Array.from(db.invitations.values()).find((i) => i.token === token);
    if (!inv || inv.status !== 'pending') {
      throw new Error('Invalid or already redeemed invitation.');
    }

    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      inv.status = 'expired';
      throw new Error('This invitation link has expired.');
    }

    inv.status = 'accepted';

    const memKey = `mem-${inv.workspaceId}-${userId}`;
    const membership: MembershipRecord = {
      id: `mem-${Date.now()}`,
      workspaceId: inv.workspaceId,
      userId,
      role: inv.role,
      title: 'Team Member',
      department: 'Operations',
      isActive: true,
      joinedAt: new Date().toISOString(),
    };

    db.memberships.set(memKey, membership);
    return membership;
  }

  // 8. Update membership role or status
  public updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    role: UserRole
  ): MembershipRecord {
    const memKey = `mem-${workspaceId}-${targetUserId}`;
    const mem = db.memberships.get(memKey);
    if (!mem) throw new Error('Membership not found.');

    mem.role = role;
    return mem;
  }

  // 9. Remove member
  public removeMember(workspaceId: string, targetUserId: string) {
    const memKey = `mem-${workspaceId}-${targetUserId}`;
    const mem = db.memberships.get(memKey);
    if (mem) {
      mem.isActive = false;
    }
  }

  // 10. List workspace invitations
  public getPendingInvitations(workspaceId: string): InvitationRecord[] {
    return Array.from(db.invitations.values()).filter(
      (i) => i.workspaceId === workspaceId && i.status === 'pending'
    );
  }
}

export const workspaceService = new WorkspaceService();
