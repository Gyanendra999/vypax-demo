/**
 * VYAAPX useAuth Hook
 *
 * Secure hook interfacing with Supabase Auth and Vyaapx multi-tenant workspace architecture.
 * Provides user session, current company, active workspace, loading states,
 * and automated silent token refresh.
 */
export { useAuth, AuthProvider } from '../context/AuthContext';
export type {
  AuthUser,
  Company,
  Workspace,
  WorkspaceItem,
  AuthSession,
  AuthContextType,
} from '../context/AuthContext';
