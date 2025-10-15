const API_URL = import.meta.env.VITE_API_URL || '/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signUp(email: string, password: string, name: string) {
    console.log('📡 [API CLIENT] POST /auth/signup');
    const data = await this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    console.log('📡 [API CLIENT] Resposta recebida:', data);
    this.saveToken(data.session.access_token);
    console.log('📡 [API CLIENT] Token salvo no localStorage');
    return data;
  }

  async signIn(email: string, password: string) {
    console.log('📡 [API CLIENT] POST /auth/signin');
    const data = await this.request<any>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    console.log('📡 [API CLIENT] Resposta recebida:', data);
    this.saveToken(data.session.access_token);
    console.log('📡 [API CLIENT] Token salvo no localStorage');
    return data;
  }

  async signOut() {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getUser() {
    return this.request<any>('/auth/user');
  }

  async updateProfile(updates: { name?: string; phone?: string }) {
    return this.request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Clusters
  async getClusters() {
    return this.request<any[]>('/clusters');
  }

  async createCluster(data: { name: string; is_active?: boolean }) {
    return this.request<any>('/clusters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCluster(id: string, data: { name?: string; is_active?: boolean }) {
    return this.request<any>(`/clusters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Resources
  async getResourcesCreated(params?: { cluster_id?: string; run_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/resources-created${query ? `?${query}` : ''}`);
  }

  async getResourcesUnused(params?: { cluster_id?: string; run_id?: string; type?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/resources-unused${query ? `?${query}` : ''}`);
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getUnusedByType() {
    return this.request<any[]>('/dashboard/unused-by-type');
  }

  // Runs
  async getRuns(params?: { cluster_id?: string; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/runs${query ? `?${query}` : ''}`);
  }

  // Admin
  async getUsers() {
    return this.request<any[]>('/admin/users');
  }

  async updateUser(id: string, data: { role?: string; is_active?: boolean }) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // User Cluster Permissions
  async getUserClusterPermissions() {
    return this.request<any[]>('/user-cluster-permissions');
  }

  async updateUserClusterPermission(userId: string, clusterId: string, canView: boolean) {
    return this.request<any>('/user-cluster-permissions', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, cluster_id: clusterId, can_view: canView }),
    });
  }

  async deleteUserClusterPermission(userId: string, clusterId: string) {
    return this.request<any>(`/user-cluster-permissions/${userId}/${clusterId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_URL);
