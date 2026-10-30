import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import { requireWorkspace } from '../middleware/workspaceMiddleware';
import { requirePermission } from '../middleware/rbacMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { authService } from '../services/authService';
import { workspaceService } from '../services/workspaceService';
import { shipmentService } from '../services/shipmentService';
import { documentService } from '../services/documentService';
import { backendCalculatorService } from '../services/calculatorService';
import { opportunityService, partnerService } from '../services/partnerService';
import { activityService, notificationService } from '../services/activityService';
import { aiAssistantService } from '../services/aiAssistantService';
import { db } from '../db/database';

export const apiRouter = Router();

// ==============================================================================
// 1. HEALTH & OPENAPI SPEC
// ==============================================================================
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Vyaapx Operating Layer for International Trade',
    database: db.isSupabaseConnected ? 'connected (Supabase)' : 'connected (operational store)',
    geminiAi: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    activeShipmentsCount: db.shipments.size,
    registeredUsersCount: db.users.size,
  });
});

apiRouter.get('/docs', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Vyaapx Trade Operating Layer API',
      version: '1.0.0',
      description: 'Production B2B API for international trade, logistics execution, landed cost calculation, and customs documentation.',
    },
    paths: {
      '/api/v1/auth/login': { post: { summary: 'Login with email and password' } },
      '/api/v1/auth/register': { post: { summary: 'Register company and principal user' } },
      '/api/v1/workspaces': { get: { summary: 'List user workspaces' }, post: { summary: 'Create workspace' } },
      '/api/v1/shipments': { get: { summary: 'List shipments' }, post: { summary: 'Create shipment' } },
      '/api/v1/documents': { get: { summary: 'List documents' }, post: { summary: 'Generate or upload document' } },
      '/api/v1/calculator/calculate': { post: { summary: 'Authoritative landed cost calculation' } },
      '/api/v1/assistant/chat': { post: { summary: 'Server-side Gemini trade assistant' } },
    },
  });
});

// ==============================================================================
// 2. AUTHENTICATION (MULTIPLE METHODS)
// ==============================================================================
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

apiRouter.post('/auth/register', validateRequest({ body: RegisterSchema }), async (req, res, next) => {
  try {
    const result = await authService.registerWithEmail(req.body);
    res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

apiRouter.post('/auth/login', validateRequest({ body: LoginSchema }), async (req, res, next) => {
  try {
    const result = await authService.loginWithEmail(req.body.email, req.body.password);
    if (result.token) {
      res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
      res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    }
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

apiRouter.post('/auth/logout', requireAuth, (req, res) => {
  authService.revokeToken(req.token);
  res.clearCookie('vyaapx_token');
  res.clearCookie('vypax_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', requireAuth, (req, res) => {
  const user = req.user!;
  const workspaces = workspaceService.getUserWorkspaces(user.id);
  res.json({
    user,
    workspaces,
    currentWorkspace: workspaces[0] || null,
  });
});

apiRouter.post('/auth/refresh', requireAuth, (req, res) => {
  const user = req.user!;
  const newToken = authService.createToken(user);
  res.cookie('vyaapx_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400 * 1000,
  });
  res.cookie('vypax_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400 * 1000,
  });
  res.json({
    token: newToken,
    user,
    expiresAt: Date.now() + 7 * 86400 * 1000,
  });
});

// Email verification
apiRouter.post('/auth/verify-email/request', (req, res) => {
  const email = req.body.email || req.user?.email;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const code = authService.sendEmailVerification(email);
  res.json({ success: true, message: 'Verification code dispatched.', debugCode: code });
});

apiRouter.post('/auth/verify-email/confirm', (req, res) => {
  try {
    const { email, code } = req.body;
    authService.verifyEmail(email, code);
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Password reset
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const code = authService.requestPasswordReset(email);
  res.json({ success: true, message: 'Password reset code generated.', debugCode: code });
});

apiRouter.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    await authService.resetPassword(email, code, newPassword);
    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// OAuth (Google / Microsoft)
apiRouter.post('/auth/oauth', async (req, res) => {
  try {
    const { provider, providerId, email, name, avatarUrl } = req.body;
    const result = await authService.handleOAuthLogin({
      provider: provider || 'google',
      providerId: providerId || `oauth-${Date.now()}`,
      email: email || 'trader@vyaapx-client.internal',
      name: name || 'Google OAuth User',
      avatarUrl,
    });
    res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Passwordless Email OTP
apiRouter.post('/auth/otp/email/request', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const code = authService.sendEmailOTP(email);
  res.json({ success: true, message: 'OTP sent to your email.', debugOtp: code });
});

apiRouter.post('/auth/otp/email/verify', (req, res) => {
  try {
    const { email, code } = req.body;
    const result = authService.verifyEmailOTP(email, code);
    res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Magic link
apiRouter.post('/auth/magic-link/request', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const token = authService.createMagicLink(email);
  res.json({ success: true, magicUrl: `/login?magicToken=${token}`, token });
});

apiRouter.post('/auth/magic-link/verify', (req, res) => {
  try {
    const { token } = req.body;
    const result = authService.verifyMagicLink(token);
    res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Phone OTP
apiRouter.post('/auth/otp/phone/request', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const code = authService.sendPhoneOTP(phone);
  res.json({ success: true, message: 'SMS OTP dispatched.', debugOtp: code });
});

apiRouter.post('/auth/otp/phone/verify', (req, res) => {
  try {
    const { phone, code } = req.body;
    const result = authService.verifyPhoneOTP(phone, code);
    res.cookie('vyaapx_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.cookie('vypax_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400 * 1000 });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// TOTP MFA
apiRouter.post('/auth/mfa/totp/setup', requireAuth, (req, res) => {
  try {
    const result = authService.setupTOTP(req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/mfa/totp/verify', requireAuth, (req, res) => {
  try {
    const { code } = req.body;
    authService.verifyAndEnableMFA(req.user!.id, code);
    res.json({ success: true, message: 'MFA enabled successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login activity
apiRouter.get('/auth/login-activity', requireAuth, (req, res) => {
  const userLogs = db.auditLogs.filter((l) => l.userId === req.user?.id && l.action === 'user.login');
  res.json(userLogs);
});

// ==============================================================================
// 3. WORKSPACES & MULTI-TENANCY
// ==============================================================================
apiRouter.get('/workspaces', requireAuth, (req, res) => {
  const list = workspaceService.getUserWorkspaces(req.user!.id);
  res.json(list);
});

apiRouter.post('/workspaces', requireAuth, (req, res) => {
  try {
    const { name, description, companyId } = req.body;
    const ws = workspaceService.createWorkspace({
      userId: req.user!.id,
      name,
      description,
      companyId,
    });
    res.status(201).json(ws);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/workspaces/:id', requireAuth, requireWorkspace, (req, res) => {
  try {
    const details = workspaceService.getWorkspace(req.workspaceId!);
    res.json(details);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

apiRouter.patch('/workspaces/:id', requireAuth, requireWorkspace, requirePermission('workspace:update'), (req, res) => {
  try {
    const updated = workspaceService.updateWorkspaceSettings(req.workspaceId!, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/workspaces/:id/company', requireAuth, requireWorkspace, requirePermission('settings:manage'), (req, res) => {
  try {
    const ws = db.workspaces.get(req.workspaceId!);
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    const updated = workspaceService.updateCompanySettings(ws.companyId, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/workspaces/:id/invitations', requireAuth, requireWorkspace, requirePermission('members:invite'), (req, res) => {
  try {
    const { email, role } = req.body;
    const inv = workspaceService.createInvitation({
      workspaceId: req.workspaceId!,
      inviterId: req.user!.id,
      email,
      role: role || 'viewer',
    });
    res.status(201).json(inv);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/workspaces/:id/invitations', requireAuth, requireWorkspace, (req, res) => {
  const invitations = workspaceService.getPendingInvitations(req.workspaceId!);
  res.json(invitations);
});

apiRouter.post('/workspaces/invitations/accept', requireAuth, (req, res) => {
  try {
    const { token } = req.body;
    const membership = workspaceService.acceptInvitation(token, req.user!.id);
    res.json({ success: true, membership });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/workspaces/:id/members/:userId', requireAuth, requireWorkspace, requirePermission('members:manage'), (req, res) => {
  try {
    const { role } = req.body;
    const updated = workspaceService.updateMemberRole(req.workspaceId!, req.params.userId, role);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// 4. SHIPMENTS
// ==============================================================================
apiRouter.get('/shipments', optionalAuth, requireWorkspace, (req, res) => {
  const { search, status, origin, destination } = req.query as any;
  const list = shipmentService.listShipments(req.workspaceId!, { search, status, origin, destination });
  res.json(list);
});

apiRouter.get('/shipments/:id', optionalAuth, requireWorkspace, (req, res) => {
  const s = shipmentService.getShipmentById(req.workspaceId!, req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found.' });
  res.json(s);
});

apiRouter.post('/shipments', requireAuth, requireWorkspace, requirePermission('shipments:create'), (req, res) => {
  try {
    const created = shipmentService.createShipment(
      req.workspaceId!,
      req.user?.fullName || 'Operations Manager',
      req.body
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/shipments/:id/status', requireAuth, requireWorkspace, requirePermission('shipments:update'), (req, res) => {
  try {
    const { status, note } = req.body;
    const updated = shipmentService.updateShipmentStatus(
      req.workspaceId!,
      req.params.id,
      status,
      note,
      req.user?.fullName || 'Operations Desk'
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// 5. DOCUMENTS
// ==============================================================================
apiRouter.get('/documents', optionalAuth, requireWorkspace, (req, res) => {
  const shipmentId = req.query.shipmentId as string | undefined;
  const docs = documentService.listDocuments(req.workspaceId!, shipmentId);
  res.json(docs);
});

apiRouter.patch('/documents/:id/status', requireAuth, requireWorkspace, requirePermission('documents:verify'), (req, res) => {
  try {
    const { shipmentId, status, verifiedBy, notes } = req.body;
    const doc = documentService.updateDocumentStatus({
      workspaceId: req.workspaceId!,
      shipmentId,
      docId: req.params.id,
      newStatus: status,
      verifiedBy: verifiedBy || req.user?.fullName,
      actorName: req.user?.fullName,
      notes,
    });
    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/documents/draft', requireAuth, requireWorkspace, requirePermission('documents:upload'), (req, res) => {
  try {
    const { shipmentId, name } = req.body;
    const doc = documentService.generateDraftDocument({
      workspaceId: req.workspaceId!,
      shipmentId,
      docType: name,
      actorName: req.user?.fullName,
    });
    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/documents/upload', requireAuth, requireWorkspace, requirePermission('documents:upload'), (req, res) => {
  try {
    const { shipmentId, name, fileName, fileSize, mimeType, notes } = req.body;
    const doc = documentService.uploadDocument({
      workspaceId: req.workspaceId!,
      shipmentId,
      name,
      fileName: fileName || `${name.replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || 1024 * 45,
      mimeType: mimeType || 'application/pdf',
      actorName: req.user?.fullName || 'Documentation Lead',
      notes,
    });
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/documents/:id/download', optionalAuth, requireWorkspace, (req, res) => {
  try {
    const signed = documentService.getSignedDownloadUrl(req.workspaceId!, req.params.id);
    res.json(signed);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ==============================================================================
// 6. TRADE OPPORTUNITIES & PARTNERS
// ==============================================================================
apiRouter.get('/opportunities', optionalAuth, requireWorkspace, (req, res) => {
  const { category, search } = req.query as any;
  const list = opportunityService.listOpportunities(req.workspaceId!, { category, search });
  res.json(list);
});

apiRouter.post('/opportunities/:id/toggle-save', optionalAuth, requireWorkspace, (req, res) => {
  try {
    const opp = opportunityService.toggleSaveOpportunity(req.params.id);
    res.json(opp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/partners', optionalAuth, requireWorkspace, (req, res) => {
  const { type, search } = req.query as any;
  const list = partnerService.listPartners(req.workspaceId!, { type, search });
  res.json(list);
});

apiRouter.post('/partners', requireAuth, requireWorkspace, requirePermission('partners:manage'), (req, res) => {
  try {
    const created = partnerService.createPartner(req.workspaceId!, req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// 7. LANDED COST CALCULATOR
// ==============================================================================
apiRouter.post('/calculator/calculate', optionalAuth, (req, res) => {
  try {
    const calculation = backendCalculatorService.calculate(req.body);
    res.json(calculation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/calculator/convert', optionalAuth, (req, res) => {
  try {
    const { calculation, targetCurrency } = req.body;
    const result = backendCalculatorService.convertCurrency(calculation, targetCurrency || 'EUR');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/calculator/save', requireAuth, requireWorkspace, requirePermission('calculator:export'), (req, res) => {
  try {
    const saved = backendCalculatorService.saveCalculation(req.workspaceId!, req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/calculator/history', requireAuth, requireWorkspace, (req, res) => {
  const history = backendCalculatorService.getHistory(req.workspaceId!);
  res.json(history);
});

// ==============================================================================
// 8. ACTIVITY FEED & NOTIFICATIONS
// ==============================================================================
apiRouter.get('/activity', optionalAuth, requireWorkspace, (req, res) => {
  const list = activityService.listActivities(req.workspaceId!);
  res.json(list);
});

apiRouter.get('/notifications', optionalAuth, requireWorkspace, (req, res) => {
  const list = notificationService.listNotifications(req.workspaceId!, req.user?.id);
  res.json(list);
});

apiRouter.patch('/notifications/:id/read', optionalAuth, (req, res) => {
  notificationService.markAsRead(req.params.id);
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', optionalAuth, requireWorkspace, (req, res) => {
  notificationService.markAllAsRead(req.workspaceId!, req.user?.id);
  res.json({ success: true });
});

// ==============================================================================
// 9. GEMINI TRADE ASSISTANT
// ==============================================================================
apiRouter.post('/assistant/chat', optionalAuth, requireWorkspace, async (req, res) => {
  try {
    const { message, shipmentId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const result = await aiAssistantService.getTradeAdvice({
      workspaceId: req.workspaceId!,
      query: message,
      shipmentId,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Trade assistant processing failed.' });
  }
});
