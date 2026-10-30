import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, OTPRecord } from '../db/database';
import { AuthUser, UserRole } from '../types/backend';

const JWT_SECRET = process.env.JWT_SECRET || 'vyaapx-super-secure-production-trade-jwt-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // Generate session token
  public createToken(user: AuthUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    db.activeSessions.add(token);
    return token;
  }

  // Revoke session
  public revokeToken(token?: string) {
    if (token) {
      db.activeSessions.delete(token);
    }
  }

  // 1. Email & Password Registration
  public async registerWithEmail(params: {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
    phone?: string;
  }): Promise<{ user: AuthUser; token: string }> {
    const existing = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newUser: AuthUser = {
      id: userId,
      email: params.email.toLowerCase(),
      fullName: params.fullName,
      phone: params.phone,
      emailVerified: false,
      isActive: true,
      isSuspended: false,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, newUser);
    db.passwords.set(userId, passwordHash);

    // If companyName provided, create company & workspace
    const companyId = `comp-${Date.now()}`;
    const companyName = params.companyName || `${params.fullName}'s Trading Co.`;
    db.companies.set(companyId, {
      id: companyId,
      name: companyName,
      code: `EXP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      iecNumber: 'PENDING-REG',
      adCode: 'AD-PENDING',
      gstin: 'GST-PENDING',
      portRegistration: 'INNSA1 (Nhava Sheva Sea)',
      defaultCurrency: 'USD',
      defaultIncoterm: 'CIF - Cost, Insurance and Freight',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const workspaceId = `ws-${Date.now()}`;
    db.workspaces.set(workspaceId, {
      id: workspaceId,
      companyId,
      name: `${companyName} - Operations`,
      slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
      description: 'Primary trade workspace',
      settings: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Make registrant owner
    db.memberships.set(`mem-${workspaceId}-${userId}`, {
      id: `mem-${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role: 'owner',
      title: 'Company Principal / Owner',
      department: 'Executive',
      isActive: true,
      joinedAt: new Date().toISOString(),
    });

    this.logLoginActivity(userId, 'email_password', false);

    const token = this.createToken(newUser);
    return { user: newUser, token };
  }

  // 1. Email & Password Login
  public async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; token: string; requiresMFA?: boolean }> {
    const user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    if (user.isSuspended) {
      throw new Error(`Account suspended: ${user.suspensionReason || 'Contact compliance administrator.'}`);
    }

    const storedHash = db.passwords.get(user.id);
    if (!storedHash) {
      // Demo accounts or social-only accounts without password set
      // For demo accounts, accept standard demo password 'demo1234'
      if (password !== 'demo1234') {
        throw new Error('Invalid email or password credentials.');
      }
    } else {
      const isMatch = await bcrypt.compare(password, storedHash);
      if (!isMatch) {
        throw new Error('Invalid email or password credentials.');
      }
    }

    if (user.mfaEnabled) {
      return { user, token: '', requiresMFA: true };
    }

    this.logLoginActivity(user.id, 'email_password', false);
    const token = this.createToken(user);
    return { user, token };
  }

  // 2. Email Verification
  public sendEmailVerification(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps.set(`verify_${email.toLowerCase()}`, {
      id: crypto.randomUUID(),
      target: email.toLowerCase(),
      code,
      type: 'email_verify',
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
    });
    return code;
  }

  public verifyEmail(email: string, code: string): boolean {
    const record = db.otps.get(`verify_${email.toLowerCase()}`);
    if (!record || record.expiresAt < Date.now() || record.code !== code) {
      throw new Error('Invalid or expired verification code.');
    }
    db.otps.delete(`verify_${email.toLowerCase()}`);

    const user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (user) {
      user.emailVerified = true;
    }
    return true;
  }

  // 3. Password Reset Flow
  public requestPasswordReset(email: string): string {
    const user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      // Return dummy token to avoid email enumeration
      return '000000';
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps.set(`reset_${email.toLowerCase()}`, {
      id: crypto.randomUUID(),
      target: email.toLowerCase(),
      code,
      type: 'password_reset',
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
    });
    return code;
  }

  public async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const record = db.otps.get(`reset_${email.toLowerCase()}`);
    if (!record || record.expiresAt < Date.now() || record.code !== code) {
      throw new Error('Invalid or expired password reset code.');
    }
    db.otps.delete(`reset_${email.toLowerCase()}`);

    const user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) throw new Error('User not found.');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    db.passwords.set(user.id, hash);
    return true;
  }

  // 4 & 5. OAuth Logins (Google & Microsoft)
  public async handleOAuthLogin(params: {
    provider: 'google' | 'microsoft';
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<{ user: AuthUser; token: string }> {
    let user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );

    if (!user) {
      // Create new central user identity
      const userId = `user-oauth-${Date.now()}`;
      user = {
        id: userId,
        email: params.email.toLowerCase(),
        fullName: params.name,
        avatarUrl: params.avatarUrl,
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      db.users.set(userId, user);

      // Create company & workspace
      const companyId = `comp-oauth-${Date.now()}`;
      db.companies.set(companyId, {
        id: companyId,
        name: `${params.name} Trade Operations`,
        code: `ORG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        iecNumber: 'PENDING-REG',
        adCode: 'AD-PENDING',
        gstin: 'GST-PENDING',
        portRegistration: 'INNSA1 (Nhava Sheva Sea)',
        defaultCurrency: 'USD',
        defaultIncoterm: 'CIF - Cost, Insurance and Freight',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const wsId = `ws-oauth-${Date.now()}`;
      db.workspaces.set(wsId, {
        id: wsId,
        companyId,
        name: `${params.name} Workspace`,
        slug: params.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-ws',
        description: 'Auto-provisioned workspace',
        settings: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      db.memberships.set(`mem-${wsId}-${userId}`, {
        id: `mem-${wsId}-${userId}`,
        workspaceId: wsId,
        userId,
        role: 'owner',
        title: 'Organization Owner',
        department: 'Operations',
        isActive: true,
        joinedAt: new Date().toISOString(),
      });
    }

    this.logLoginActivity(user.id, `oauth_${params.provider}`, false);
    const token = this.createToken(user);
    return { user, token };
  }

  // 6. Passwordless Email OTP
  public sendEmailOTP(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps.set(`otp_${email.toLowerCase()}`, {
      id: crypto.randomUUID(),
      target: email.toLowerCase(),
      code,
      type: 'email_login',
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    return code;
  }

  public verifyEmailOTP(email: string, code: string): { user: AuthUser; token: string } {
    const record = db.otps.get(`otp_${email.toLowerCase()}`);
    if (!record || record.expiresAt < Date.now() || record.code !== code) {
      throw new Error('Invalid or expired OTP verification code.');
    }
    db.otps.delete(`otp_${email.toLowerCase()}`);

    let user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      // Auto-register via email OTP
      const userId = `user-otp-${Date.now()}`;
      const name = email.split('@')[0];
      user = {
        id: userId,
        email: email.toLowerCase(),
        fullName: name.charAt(0).toUpperCase() + name.slice(1),
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      db.users.set(userId, user);

      // Link to default workspace as operations executive
      db.memberships.set(`mem-ws-default-001-${userId}`, {
        id: `mem-ws-default-001-${userId}`,
        workspaceId: 'ws-default-001',
        userId,
        role: 'operations_executive',
        title: 'Operations Analyst',
        department: 'Trade Logistics',
        isActive: true,
        joinedAt: new Date().toISOString(),
      });
    }

    this.logLoginActivity(user.id, 'email_otp', false);
    const token = this.createToken(user);
    return { user, token };
  }

  // 7. Magic Link Authentication
  public createMagicLink(email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    db.otps.set(`magic_${token}`, {
      id: crypto.randomUUID(),
      target: email.toLowerCase(),
      code: token,
      type: 'email_login',
      expiresAt: Date.now() + 20 * 60 * 1000,
      attempts: 0,
    });
    return token;
  }

  public verifyMagicLink(token: string): { user: AuthUser; token: string } {
    const record = db.otps.get(`magic_${token}`);
    if (!record || record.expiresAt < Date.now()) {
      throw new Error('Invalid or expired magic link.');
    }
    db.otps.delete(`magic_${token}`);

    return this.verifyEmailOTP(record.target, record.code);
  }

  // 8. Phone OTP Authentication
  public sendPhoneOTP(phone: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps.set(`phone_${phone.replace(/\s+/g, '')}`, {
      id: crypto.randomUUID(),
      target: phone,
      code,
      type: 'phone_login',
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    return code;
  }

  public verifyPhoneOTP(phone: string, code: string): { user: AuthUser; token: string } {
    const cleanPhone = phone.replace(/\s+/g, '');
    const record = db.otps.get(`phone_${cleanPhone}`);
    if (!record || record.expiresAt < Date.now() || record.code !== code) {
      throw new Error('Invalid or expired SMS OTP code.');
    }
    db.otps.delete(`phone_${cleanPhone}`);

    let user = Array.from(db.users.values()).find((u) => u.phone && u.phone.replace(/\s+/g, '') === cleanPhone);
    if (!user) {
      const userId = `user-phone-${Date.now()}`;
      user = {
        id: userId,
        email: `phone_${cleanPhone.replace(/[^0-9]/g, '')}@vyaapx-identity.internal`,
        fullName: `Trader (${phone.slice(-4)})`,
        phone,
        emailVerified: false,
        phoneVerified: true,
        isActive: true,
        isSuspended: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      db.users.set(userId, user);

      db.memberships.set(`mem-ws-default-001-${userId}`, {
        id: `mem-ws-default-001-${userId}`,
        workspaceId: 'ws-default-001',
        userId,
        role: 'viewer',
        title: 'Mobile Verified Trader',
        department: 'Operations Desk',
        isActive: true,
        joinedAt: new Date().toISOString(),
      });
    }

    this.logLoginActivity(user.id, 'phone_otp', false);
    const token = this.createToken(user);
    return { user, token };
  }

  // 9. MFA TOTP Setup & Verification
  public setupTOTP(userId: string): { secret: string; otpauthUrl: string; backupCodes: string[] } {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found.');

    const secret = crypto.randomBytes(20).toString('hex').slice(0, 32).toUpperCase();
    const backupCodes = Array.from({ length: 6 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    user.mfaSecret = secret;
    user.mfaBackupCodes = backupCodes;

    const otpauthUrl = `otpauth://totp/Vyaapx:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Vyaapx`;

    return { secret, otpauthUrl, backupCodes };
  }

  public verifyAndEnableMFA(userId: string, code: string): boolean {
    const user = db.users.get(userId);
    if (!user || !user.mfaSecret) throw new Error('MFA has not been initiated.');

    // Simulated TOTP validation (accepts 6-digit code or matching backup code)
    if (code.length === 6 || (user.mfaBackupCodes && user.mfaBackupCodes.includes(code.toUpperCase()))) {
      user.mfaEnabled = true;
      return true;
    }
    throw new Error('Invalid MFA token code.');
  }

  // 10. Enterprise SAML/OIDC SSO
  public handleEnterpriseSSO(params: {
    domain: string;
    samlResponseToken: string;
    email: string;
    name: string;
  }): { user: AuthUser; token: string } {
    let user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );

    if (!user) {
      const userId = `user-sso-${Date.now()}`;
      user = {
        id: userId,
        email: params.email.toLowerCase(),
        fullName: params.name,
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      db.users.set(userId, user);

      db.memberships.set(`mem-ws-default-001-${userId}`, {
        id: `mem-ws-default-001-${userId}`,
        workspaceId: 'ws-default-001',
        userId,
        role: 'operations_executive',
        title: 'Enterprise SSO User',
        department: 'Operations',
        isActive: true,
        joinedAt: new Date().toISOString(),
      });
    }

    this.logLoginActivity(user.id, 'saml_sso', false);
    const token = this.createToken(user);
    return { user, token };
  }

  // 13. Account Suspension & Recovery
  public toggleAccountSuspension(userId: string, suspend: boolean, reason?: string) {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found.');
    user.isSuspended = suspend;
    user.suspensionReason = suspend ? reason || 'Administrative compliance review' : undefined;
  }

  // 14. Activity Monitoring
  public logLoginActivity(userId: string, method: string, isSuspicious: boolean) {
    db.auditLogs.push({
      id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      workspaceId: 'ws-default-001',
      userId,
      action: 'user.login',
      entityType: 'auth',
      entityId: userId,
      newState: { method, isSuspicious },
      ipAddress: '127.0.0.1',
      userAgent: 'Vyaapx Applet Browser Client',
      createdAt: new Date().toISOString(),
    });
  }
}

export const authService = new AuthService();
