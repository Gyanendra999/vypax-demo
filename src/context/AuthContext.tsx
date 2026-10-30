import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { apiClient } from '../services/apiClient';
import { DEMO_COMPANY } from '../data/mockData';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  mfaEnabled: boolean;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  iecNumber: string;
  adCode: string;
  gstin: string;
  portRegistration: string;
  defaultCurrency: string;
  defaultIncoterm: string;
}

export interface Workspace {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  isActive: boolean;
}

export interface WorkspaceItem {
  workspace: Workspace;
  role: string;
  company: Company;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  user: AuthUser;
}

export interface AuthContextType {
  // Core Requested Properties
  session: AuthSession | Session | null;
  user: AuthUser | null;
  currentCompany: Company | null;
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Multi-Tenant Workspaces
  workspaces: WorkspaceItem[];
  currentWorkspace: WorkspaceItem | null;
  currentRole: string;
  switchWorkspace: (workspaceId: string) => Promise<void>;

  // Authentication Operations
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUp: (data: { email: string; password: string; fullName: string; companyName?: string }) => Promise<any>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;

  // Modal State & Backward-Compatibility Helpers
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<any>;
  register: (data: { email: string; password: string; fullName: string; companyName?: string }) => Promise<any>;
  logout: () => Promise<void>;
  loginOAuth: (provider: 'google' | 'microsoft', email?: string, name?: string) => Promise<any>;
  sendEmailOTP: (email: string) => Promise<string>;
  verifyEmailOTP: (email: string, code: string) => Promise<any>;
  sendPhoneOTP: (phone: string) => Promise<string>;
  verifyPhoneOTP: (phone: string, code: string) => Promise<any>;
  setupTOTP: () => Promise<{ secret: string; otpauthUrl: string; backupCodes: string[] }>;
  verifyTOTP: (code: string) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const DEFAULT_COMPANY: Company = {
  id: 'comp-meridian-001',
  name: DEMO_COMPANY.name,
  code: DEMO_COMPANY.code,
  iecNumber: DEMO_COMPANY.iecNumber,
  adCode: DEMO_COMPANY.adCode,
  gstin: DEMO_COMPANY.gstin,
  portRegistration: DEMO_COMPANY.portRegistration,
  defaultCurrency: 'USD',
  defaultIncoterm: 'CIF - Cost, Insurance and Freight',
};

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  {
    workspace: {
      id: 'ws-default-001',
      companyId: 'comp-meridian-001',
      name: 'Primary Export Operations',
      slug: 'meridian-exports-primary',
      description: 'Primary international trade, customs filing, and freight operations desk.',
      isActive: true,
    },
    role: 'operations_manager',
    company: DEFAULT_COMPANY,
  },
  {
    workspace: {
      id: 'ws-dubai-002',
      companyId: 'comp-meridian-001',
      name: 'Gulf Region Operations (Jebel Ali CFS)',
      slug: 'meridian-dubai-hub',
      description: 'Middle East regional distribution and warehousing workspace.',
      isActive: true,
    },
    role: 'operations_manager',
    company: DEFAULT_COMPANY,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Buffer before actual expiration (5 minutes in ms)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>({
    id: 'user-aarav-001',
    email: DEMO_COMPANY.currentUser.email,
    fullName: DEMO_COMPANY.currentUser.name,
    phone: '+91 98200 12345',
    emailVerified: true,
    mfaEnabled: false,
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    try {
      return localStorage.getItem('vyaapx_active_workspace_id') || localStorage.getItem('vypax_active_workspace_id') || 'ws-default-001';
    } catch {
      return 'ws-default-001';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------------------------------
  // Automatic Silent Token Refresh Logic
  // ----------------------------------------------------------------------------
  const scheduleSilentRefresh = useCallback((expiresAtTimestamp?: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!expiresAtTimestamp) return;

    const expiresInMs = expiresAtTimestamp - Date.now();
    // Schedule refresh 5 minutes before expiration, or in 30 seconds if already close
    const delay = Math.max(expiresInMs - REFRESH_THRESHOLD_MS, 30 * 1000);

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('[useAuth] Executing automated silent token refresh...');
      try {
        await refreshSession();
      } catch (err) {
        console.warn('[useAuth] Automated silent refresh failed:', err);
      }
    }, delay);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    // 1. If Supabase Auth is actively configured, use Supabase's native refresh
    if (isSupabaseConfigured()) {
      try {
        const { data, error: supaErr } = await supabase.auth.refreshSession();
        if (supaErr) throw supaErr;

        if (data.session) {
          const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600 * 1000;
          const mappedUser: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            fullName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
            avatarUrl: data.session.user.user_metadata?.avatar_url,
            phone: data.session.user.phone,
            emailVerified: Boolean(data.session.user.email_confirmed_at),
            phoneVerified: Boolean(data.session.user.phone_confirmed_at),
            mfaEnabled: Boolean(data.session.user.factors && data.session.user.factors.length > 0),
          };

          const newSession: AuthSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: expiresAt,
            token_type: data.session.token_type,
            user: mappedUser,
          };

          setSession(newSession);
          setUser(mappedUser);
          apiClient.setToken(data.session.access_token);
          scheduleSilentRefresh(expiresAt);
          return newSession;
        }
      } catch (supaErr) {
        console.warn('[useAuth] Supabase SDK refresh error, attempting backend proxy refresh:', supaErr);
      }
    }

    // 2. Refresh via backend API token endpoint
    try {
      const res = await apiClient.post('/auth/refresh');
      if (res && res.token) {
        apiClient.setToken(res.token);
        const expiresAt = res.expiresAt || Date.now() + 7 * 86400 * 1000;
        const updatedUser: AuthUser = res.user || user;

        const updatedSession: AuthSession = {
          access_token: res.token,
          expires_at: expiresAt,
          token_type: 'Bearer',
          user: updatedUser,
        };

        setSession(updatedSession);
        setUser(updatedUser);
        scheduleSilentRefresh(expiresAt);
        return updatedSession;
      }
    } catch (err: any) {
      console.warn('[useAuth] Backend token refresh response:', err?.message || err);
    }

    return null;
  }, [scheduleSilentRefresh, user]);

  // ----------------------------------------------------------------------------
  // Fetch Current User, Company, and Workspaces
  // ----------------------------------------------------------------------------
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check existing token
      const token = apiClient.getToken();

      // Fetch user profile & workspaces
      const res = await apiClient.get('/auth/me');
      if (res.user) {
        setUser(res.user);
        if (token) {
          const sess: AuthSession = {
            access_token: token,
            expires_at: Date.now() + 7 * 86400 * 1000,
            token_type: 'Bearer',
            user: res.user,
          };
          setSession(sess);
          scheduleSilentRefresh(sess.expires_at);
        }
      }

      if (res.workspaces && Array.isArray(res.workspaces) && res.workspaces.length > 0) {
        setWorkspaces(res.workspaces);

        // Ensure active workspace exists in list
        const exists = res.workspaces.some((w: any) => w.workspace.id === currentWorkspaceId);
        if (!exists) {
          const firstId = res.workspaces[0].workspace.id;
          setCurrentWorkspaceId(firstId);
          apiClient.setWorkspaceId(firstId);
        }
      }
    } catch (err: any) {
      // Backend not yet ready or offline; fallback to pristine baseline state
      console.info('[useAuth] Initialized in resilient operational state.');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [currentWorkspaceId, scheduleSilentRefresh]);

  // ----------------------------------------------------------------------------
  // Initialization & Supabase Auth Event Listeners
  // ----------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Auth Check
    refreshAuth();

    // 2. Supabase onAuthStateChange listener
    let authListenerSubscription: { unsubscribe: () => void } | null = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, supaSession) => {
            if (!isMounted) return;

            console.log(`[useAuth] Supabase Auth State Changed: ${event}`);

            if (supaSession) {
              const expiresAt = supaSession.expires_at ? supaSession.expires_at * 1000 : Date.now() + 3600 * 1000;
              const mappedUser: AuthUser = {
                id: supaSession.user.id,
                email: supaSession.user.email || '',
                fullName: supaSession.user.user_metadata?.full_name || supaSession.user.email?.split('@')[0] || 'User',
                avatarUrl: supaSession.user.user_metadata?.avatar_url,
                phone: supaSession.user.phone,
                emailVerified: Boolean(supaSession.user.email_confirmed_at),
                phoneVerified: Boolean(supaSession.user.phone_confirmed_at),
                mfaEnabled: Boolean(supaSession.user.factors && supaSession.user.factors.length > 0),
              };

              setSession(supaSession);
              setUser(mappedUser);
              apiClient.setToken(supaSession.access_token);
              scheduleSilentRefresh(expiresAt);
            } else if (event === 'SIGNED_OUT') {
              setSession(null);
              apiClient.setToken(null);
            }
          }
        );
        authListenerSubscription = subscription;
      } catch (err) {
        console.warn('[useAuth] Supabase auth listener setup skipped:', err);
      }
    }

    // Cleanup timers and subscriptions
    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe();
      }
    };
  }, [refreshAuth, scheduleSilentRefresh]);

  // ----------------------------------------------------------------------------
  // Workspace Switching
  // ----------------------------------------------------------------------------
  const switchWorkspace = async (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    apiClient.setWorkspaceId(workspaceId);

    try {
      localStorage.setItem('vyaapx_active_workspace_id', workspaceId);
      localStorage.setItem('vypax_active_workspace_id', workspaceId);
    } catch {
      // ignore
    }

    // Trigger reactive data reload across all subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vyaapx:workspace-switched', { detail: { workspaceId } })
      );
      window.dispatchEvent(
        new CustomEvent('vypax:workspace-switched', { detail: { workspaceId } })
      );
    }
  };

  // ----------------------------------------------------------------------------
  // Authentication Actions
  // ----------------------------------------------------------------------------
  const signInWithPassword = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try Supabase Auth first if configured
      if (isSupabaseConfigured()) {
        const { data, error: supaErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (supaErr) throw supaErr;
        if (data.session) {
          apiClient.setToken(data.session.access_token);
          await refreshAuth();
          setIsAuthModalOpen(false);
          return data;
        }
      }

      // 2. Authenticate through backend API
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.token) {
        apiClient.setToken(res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
      await refreshAuth();
      setIsAuthModalOpen(false);
      return res;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const { data: supaData, error: supaErr } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              company_name: data.companyName,
            },
          },
        });
        if (supaErr) throw supaErr;
        if (supaData.session) {
          apiClient.setToken(supaData.session.access_token);
        }
      }

      const res = await apiClient.post('/auth/register', data);
      if (res.token) {
        apiClient.setToken(res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
      await refreshAuth();
      setIsAuthModalOpen(false);
      return res;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => null);
      }
      await apiClient.post('/auth/logout').catch(() => null);
    } finally {
      apiClient.setToken(null);
      setSession(null);
      setUser(null);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const loginOAuth = async (
    provider: 'google' | 'microsoft',
    email?: string,
    name?: string
  ) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error: supaErr } = await supabase.auth.signInWithOAuth({
          provider: provider === 'microsoft' ? 'azure' : 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (supaErr) throw supaErr;
      }

      const res = await apiClient.post('/auth/oauth', { provider, email, name });
      if (res.token) apiClient.setToken(res.token);
      if (res.user) setUser(res.user);
      await refreshAuth();
      setIsAuthModalOpen(false);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOTP = async (email: string) => {
    const res = await apiClient.post('/auth/otp/email/request', { email });
    return res.debugOtp || 'sent';
  };

  const verifyEmailOTP = async (email: string, code: string) => {
    const res = await apiClient.post('/auth/otp/email/verify', { email, code });
    if (res.token) apiClient.setToken(res.token);
    if (res.user) setUser(res.user);
    await refreshAuth();
    setIsAuthModalOpen(false);
    return res;
  };

  const sendPhoneOTP = async (phone: string) => {
    const res = await apiClient.post('/auth/otp/phone/request', { phone });
    return res.debugOtp || 'sent';
  };

  const verifyPhoneOTP = async (phone: string, code: string) => {
    const res = await apiClient.post('/auth/otp/phone/verify', { phone, code });
    if (res.token) apiClient.setToken(res.token);
    if (res.user) setUser(res.user);
    await refreshAuth();
    setIsAuthModalOpen(false);
    return res;
  };

  const setupTOTP = async () => {
    return apiClient.post('/auth/mfa/totp/setup');
  };

  const verifyTOTP = async (code: string) => {
    const res = await apiClient.post('/auth/mfa/totp/verify', { code });
    if (res.success) {
      if (user) setUser({ ...user, mfaEnabled: true });
      return true;
    }
    return false;
  };

  // ----------------------------------------------------------------------------
  // Active Workspace and Current Company Resolution
  // ----------------------------------------------------------------------------
  const activeWorkspaceItem =
    workspaces.find((w) => w.workspace.id === currentWorkspaceId) ||
    workspaces[0] ||
    DEFAULT_WORKSPACES[0];

  const currentCompany: Company = activeWorkspaceItem?.company || DEFAULT_COMPANY;
  const activeWorkspace: Workspace = activeWorkspaceItem?.workspace || DEFAULT_WORKSPACES[0].workspace;
  const currentRole: string = activeWorkspaceItem?.role || 'operations_manager';

  return (
    <AuthContext.Provider
      value={{
        // Core Requested Interface
        session,
        user,
        currentCompany,
        activeWorkspace,
        isLoading,
        isInitialized,
        isAuthenticated: Boolean(user),
        error,

        // Workspaces & Tenancy
        workspaces,
        currentWorkspace: activeWorkspaceItem,
        currentRole,
        switchWorkspace,

        // Auth Operations
        signInWithPassword,
        signUp,
        signOut,
        refreshSession,

        // Aliases & Modal Support for complete backward compatibility
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login: signInWithPassword,
        register: signUp,
        logout: signOut,
        loginOAuth,
        sendEmailOTP,
        verifyEmailOTP,
        sendPhoneOTP,
        verifyPhoneOTP,
        setupTOTP,
        verifyTOTP,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
