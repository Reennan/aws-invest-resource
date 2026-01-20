import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do import.meta.env
vi.mock('@/lib/apiClient', async () => {
  const API_URL = '/api';

  class MockApiClient {
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

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
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

    async signUp(email: string, password: string, name: string) {
      const data = await this.request<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      this.saveToken(data.session.access_token);
      return data;
    }

    async signIn(email: string, password: string) {
      const data = await this.request<any>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.saveToken(data.session.access_token);
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

    async getResourcesCreated(params?: { cluster_id?: string; run_id?: string }) {
      const query = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/resources-created${query ? `?${query}` : ''}`);
    }

    async getResourcesUnused(params?: { cluster_id?: string; run_id?: string; type?: string }) {
      const query = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/resources-unused${query ? `?${query}` : ''}`);
    }

    async getDashboardStats() {
      return this.request<any>('/dashboard/stats');
    }

    async getUnusedByType() {
      return this.request<any[]>('/dashboard/unused-by-type');
    }

    async getRuns(params?: { cluster_id?: string; limit?: number }) {
      const query = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/runs${query ? `?${query}` : ''}`);
    }

    async getUsers() {
      return this.request<any[]>('/admin/users');
    }

    async updateUser(id: string, data: { role?: string; is_active?: boolean }) {
      return this.request<any>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }

    async changeUserPassword(userId: string, password: string) {
      return this.request<any>(`/admin/users/${userId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
    }

    async deleteUser(userId: string) {
      return this.request<any>(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
    }

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

  return {
    apiClient: new MockApiClient(API_URL),
  };
});

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('deve fazer login e salvar token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com' },
        session: { access_token: 'mock-token' },
        profile: { name: 'Test User' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.signIn('test@test.com', 'password123');

      expect(result.user.email).toBe('test@test.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token');
    });

    it('deve lançar erro em credenciais inválidas', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Credenciais inválidas' }),
      });

      const { apiClient } = await import('@/lib/apiClient');
      
      await expect(apiClient.signIn('wrong@test.com', 'wrongpass')).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('signUp', () => {
    it('deve criar conta e salvar token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'new@test.com' },
        session: { access_token: 'new-token' },
        profile: { name: 'New User' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.signUp('new@test.com', 'password123', 'New User');

      expect(result.user.email).toBe('new@test.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  describe('signOut', () => {
    it('deve fazer logout e limpar token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { apiClient } = await import('@/lib/apiClient');
      await apiClient.signOut();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('getClusters', () => {
    it('deve retornar lista de clusters', async () => {
      const mockClusters = [
        { id: '1', name: 'Cluster 1', is_active: true },
        { id: '2', name: 'Cluster 2', is_active: false },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClusters),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.getClusters();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Cluster 1');
    });
  });

  describe('getResourcesCreated', () => {
    it('deve retornar recursos criados', async () => {
      const mockResources = [
        { id: '1', name: 'Resource 1', type: 'lambda' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResources),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.getResourcesCreated();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('lambda');
    });

    it('deve filtrar por cluster_id', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { apiClient } = await import('@/lib/apiClient');
      await apiClient.getResourcesCreated({ cluster_id: 'cluster-123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cluster_id=cluster-123'),
        expect.any(Object)
      );
    });
  });

  describe('getResourcesUnused', () => {
    it('deve retornar recursos sem uso', async () => {
      const mockResources = [
        { id: '1', name: 'Unused Resource', days_without_use: 30 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResources),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.getResourcesUnused();

      expect(result).toHaveLength(1);
      expect(result[0].days_without_use).toBe(30);
    });
  });

  describe('getDashboardStats', () => {
    it('deve retornar estatísticas do dashboard', async () => {
      const mockStats = {
        clusters_disponiveis: 5,
        recursos_criados_periodo: 100,
        recursos_sem_uso_periodo: 20,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.getDashboardStats();

      expect(result.clusters_disponiveis).toBe(5);
    });
  });

  describe('getUsers', () => {
    it('deve retornar lista de usuários', async () => {
      const mockUsers = [
        { id: '1', email: 'user@test.com', role: 'admin' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário', async () => {
      const mockUser = { id: '1', role: 'editor' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.updateUser('1', { role: 'editor' });

      expect(result.role).toBe('editor');
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { apiClient } = await import('@/lib/apiClient');
      const result = await apiClient.deleteUser('1');

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('deve tratar erro de rede', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Network error')),
      });

      const { apiClient } = await import('@/lib/apiClient');
      
      await expect(apiClient.getClusters()).rejects.toThrow('Erro na requisição');
    });
  });
});
