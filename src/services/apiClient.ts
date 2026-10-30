const BASE_URL = '/api/v1';

export class ApiClient {
  private token: string | null = null;
  private currentWorkspaceId: string = 'ws-default-001';

  constructor() {
    try {
      this.token = localStorage.getItem('vyaapx_auth_token') || localStorage.getItem('vypax_auth_token');
      const savedWs = localStorage.getItem('vyaapx_active_workspace_id') || localStorage.getItem('vypax_active_workspace_id');
      if (savedWs) {
        this.currentWorkspaceId = savedWs;
      }
    } catch {
      // ignore
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('vyaapx_auth_token', token);
      } else {
        localStorage.removeItem('vyaapx_auth_token');
        localStorage.removeItem('vypax_auth_token');
      }
    } catch {
      // ignore
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setWorkspaceId(workspaceId: string) {
    this.currentWorkspaceId = workspaceId;
    try {
      localStorage.setItem('vyaapx_active_workspace_id', workspaceId);
    } catch {
      // ignore
    }
  }

  public getWorkspaceId(): string {
    return this.currentWorkspaceId;
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (this.currentWorkspaceId) {
      headers.set('X-Workspace-Id', this.currentWorkspaceId);
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  public get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const qs = q.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
