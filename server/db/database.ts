import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AuthUser,
  CompanyRecord,
  WorkspaceRecord,
  MembershipRecord,
  InvitationRecord,
  UserRole,
} from '../types/backend';
import {
  Shipment,
  TradeOpportunity,
  LogisticsPartner,
  ActivityEvent,
  TradeDocument,
  LandedCostCalculation,
} from '../../src/types/trade';
import {
  INITIAL_SHIPMENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_PARTNERS,
  INITIAL_ACTIVITIES,
  DEMO_COMPANY,
} from '../../src/data/mockData';

export interface AuditLogRecord {
  id: string;
  workspaceId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  channel: 'in_app' | 'email' | 'webhook';
  deliveryStatus: 'delivered' | 'pending' | 'failed';
  createdAt: string;
}

export interface OTPRecord {
  id: string;
  target: string; // email or phone
  code: string;
  type: 'email_login' | 'phone_login' | 'email_verify' | 'password_reset';
  expiresAt: number;
  attempts: number;
}

// In-Memory & Persistent Storage Architecture
class Database {
  private supabase: SupabaseClient | null = null;
  public isSupabaseConnected = false;

  // Repositories
  public users: Map<string, AuthUser> = new Map();
  public passwords: Map<string, string> = new Map(); // userId -> bcrypt hash
  public otps: Map<string, OTPRecord> = new Map();
  public companies: Map<string, CompanyRecord> = new Map();
  public workspaces: Map<string, WorkspaceRecord> = new Map();
  public memberships: Map<string, MembershipRecord> = new Map();
  public invitations: Map<string, InvitationRecord> = new Map();
  public shipments: Map<string, Shipment & { workspaceId: string }> = new Map();
  public documents: Map<string, TradeDocument & { workspaceId: string; fileUrl?: string; versions?: any[] }> = new Map();
  public opportunities: Map<string, TradeOpportunity & { workspaceId?: string }> = new Map();
  public partners: Map<string, LogisticsPartner & { workspaceId: string }> = new Map();
  public calculations: Map<string, LandedCostCalculation & { id: string; workspaceId: string; createdAt: string }> = new Map();
  public activities: Map<string, ActivityEvent & { workspaceId: string }> = new Map();
  public auditLogs: AuditLogRecord[] = [];
  public notifications: Map<string, NotificationRecord> = new Map();
  public activeSessions: Set<string> = new Set(); // Token jti or full token

  constructor() {
    this.initSupabase();
    this.seedBaseline();
  }

  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isSupabaseConnected = true;
        console.log('[Database] Supabase client initialized successfully.');
      } catch (err) {
        console.warn('[Database] Failed to initialize Supabase client:', err);
      }
    } else {
      console.log('[Database] Running in self-contained operational database mode.');
    }
  }

  public getSupabase(): SupabaseClient | null {
    return this.supabase;
  }

  private seedBaseline() {
    const now = new Date().toISOString();

    // 1. Seed Exporter Company
    const companyId = 'comp-meridian-001';
    const company: CompanyRecord = {
      id: companyId,
      name: DEMO_COMPANY.name,
      code: DEMO_COMPANY.code,
      iecNumber: DEMO_COMPANY.iecNumber,
      adCode: DEMO_COMPANY.adCode,
      gstin: DEMO_COMPANY.gstin,
      portRegistration: DEMO_COMPANY.portRegistration,
      defaultCurrency: 'USD',
      defaultIncoterm: 'CIF - Cost, Insurance and Freight',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(companyId, company);

    // 2. Seed Default Workspace
    const defaultWorkspaceId = 'ws-default-001';
    const workspace: WorkspaceRecord = {
      id: defaultWorkspaceId,
      companyId,
      name: 'Primary Export Operations',
      slug: 'meridian-exports-primary',
      description: 'Primary international trade, customs filing, and freight operations desk.',
      settings: {
        requireTwoFactor: false,
        notificationDigest: 'realtime',
        restrictedHSChapters: ['93'],
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.set(defaultWorkspaceId, workspace);

    // Secondary workspace for multi-company / workspace switching demonstration
    const secondWorkspaceId = 'ws-dubai-002';
    this.workspaces.set(secondWorkspaceId, {
      id: secondWorkspaceId,
      companyId,
      name: 'Gulf Region Operations (Jebel Ali CFS)',
      slug: 'meridian-dubai-hub',
      description: 'Middle East regional distribution and warehousing workspace.',
      settings: {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Seed Users
    // Demo User 1: Aarav Mehta (Operations Manager)
    const userAaravId = 'user-aarav-001';
    this.users.set(userAaravId, {
      id: userAaravId,
      email: DEMO_COMPANY.currentUser.email,
      fullName: DEMO_COMPANY.currentUser.name,
      phone: '+91 98200 12345',
      avatarUrl: '',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      isSuspended: false,
      mfaEnabled: false,
      createdAt: now,
    });

    // Demo User 2: Super Admin
    const userAdminId = 'user-admin-002';
    this.users.set(userAdminId, {
      id: userAdminId,
      email: 'admin@vyaapx.com',
      fullName: 'Vikram Singhania',
      phone: '+1 415 555 0192',
      avatarUrl: '',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      isSuspended: false,
      mfaEnabled: true,
      createdAt: now,
    });

    // Demo User 3: Compliance Officer
    const userComplianceId = 'user-compliance-003';
    this.users.set(userComplianceId, {
      id: userComplianceId,
      email: 'compliance@meridianexports.in',
      fullName: 'Priya Nambiar',
      phone: '+91 98400 54321',
      avatarUrl: '',
      emailVerified: true,
      phoneVerified: false,
      isActive: true,
      isSuspended: false,
      mfaEnabled: false,
      createdAt: now,
    });

    // 4. Seed Memberships
    this.memberships.set(`mem-${defaultWorkspaceId}-${userAaravId}`, {
      id: `mem-${defaultWorkspaceId}-${userAaravId}`,
      workspaceId: defaultWorkspaceId,
      userId: userAaravId,
      role: 'operations_manager',
      title: DEMO_COMPANY.currentUser.title,
      department: DEMO_COMPANY.currentUser.department,
      isActive: true,
      joinedAt: now,
    });

    this.memberships.set(`mem-${defaultWorkspaceId}-${userAdminId}`, {
      id: `mem-${defaultWorkspaceId}-${userAdminId}`,
      workspaceId: defaultWorkspaceId,
      userId: userAdminId,
      role: 'super_admin',
      title: 'Global Platform Administrator',
      department: 'Executive Governance',
      isActive: true,
      joinedAt: now,
    });

    this.memberships.set(`mem-${defaultWorkspaceId}-${userComplianceId}`, {
      id: `mem-${defaultWorkspaceId}-${userComplianceId}`,
      workspaceId: defaultWorkspaceId,
      userId: userComplianceId,
      role: 'compliance_officer',
      title: 'Chief Customs & Compliance Lead',
      department: 'Legal & Regulatory Affairs',
      isActive: true,
      joinedAt: now,
    });

    // User Aarav also belongs to second workspace (Multi-workspace demonstration)
    this.memberships.set(`mem-${secondWorkspaceId}-${userAaravId}`, {
      id: `mem-${secondWorkspaceId}-${userAaravId}`,
      workspaceId: secondWorkspaceId,
      userId: userAaravId,
      role: 'operations_manager',
      title: 'Regional Logistics Coordinator',
      department: 'Gulf Distribution',
      isActive: true,
      joinedAt: now,
    });

    // 5. Seed Shipments & Trade Documents
    INITIAL_SHIPMENTS.forEach((s) => {
      this.shipments.set(s.id, {
        ...s,
        workspaceId: defaultWorkspaceId,
      });

      if (s.documents) {
        s.documents.forEach((doc) => {
          this.documents.set(doc.id, {
            ...doc,
            workspaceId: defaultWorkspaceId,
          });
        });
      }
    });

    // 6. Seed Opportunities
    INITIAL_OPPORTUNITIES.forEach((opp) => {
      this.opportunities.set(opp.id, {
        ...opp,
        workspaceId: defaultWorkspaceId,
      });
    });

    // 7. Seed Partners
    INITIAL_PARTNERS.forEach((partner) => {
      this.partners.set(partner.id, {
        ...partner,
        workspaceId: defaultWorkspaceId,
      });
    });

    // 8. Seed Activities
    INITIAL_ACTIVITIES.forEach((act) => {
      this.activities.set(act.id, {
        ...act,
        workspaceId: defaultWorkspaceId,
      });
    });

    // 9. Seed Initial Notifications
    const notif1: NotificationRecord = {
      id: 'notif-001',
      workspaceId: defaultWorkspaceId,
      userId: userAaravId,
      type: 'exception',
      title: 'Port Congestion Alert - VPX-24021',
      message: 'Feeder vessel rollover confirmed at Nhava Sheva. Revised cut-off communicated.',
      link: '/shipments/VPX-24021',
      isRead: false,
      channel: 'in_app',
      deliveryStatus: 'delivered',
      createdAt: now,
    };
    this.notifications.set(notif1.id, notif1);

    const notif2: NotificationRecord = {
      id: 'notif-002',
      workspaceId: defaultWorkspaceId,
      userId: userAaravId,
      type: 'document',
      title: 'Document Verified - VPX-24017',
      message: 'Certificate of Origin (CEPA) approved by JNPT Customs Desk.',
      link: '/documents',
      isRead: true,
      channel: 'in_app',
      deliveryStatus: 'delivered',
      createdAt: now,
    };
    this.notifications.set(notif2.id, notif2);
  }
}

export const db = new Database();
