import axios, { AxiosInstance, AxiosResponse } from 'axios';

type RetryableRequestConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

// Types pour les réponses standardisées du backend Django
export interface StandardApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  messageKey: string;
  data: T | null;
  timestamp: string;
  errors: Array<{
    field: string | null;
    code: string;
    message: string;
    messageKey: string;
    details: unknown;
  }> | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    page_size: number;
    next_page: number | null;
    previous_page: number | null;
    has_next: boolean;
    has_previous: boolean;
  } | null;
  userContext?: {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    tokens: {
      access: string;
      refresh: string;
    };
  } | null;
}

// Configuration de base pour l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Vérifier que l'URL est correctement formatée
const formattedApiUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

console.log('🔗 API URL configurée:', formattedApiUrl);

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;

  private isPublicAuthEndpoint(url?: string): boolean {
    if (!url) {
      return false;
    }

    return (
      url.includes('/auth/login/') ||
      url.includes('/auth/verify-otp/') ||
      url.includes('/auth/resend-otp/') ||
      url.includes('/auth/token/refresh/')
    );
  }

  constructor() {
    this.client = axios.create({
      baseURL: formattedApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token JWT
    this.client.interceptors.request.use(
      (config) => {
        if (this.isPublicAuthEndpoint(config.url)) {
          if (config.headers?.Authorization) {
            delete config.headers.Authorization;
          }
          return config;
        }

        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Token JWT ajouté à la requête:', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => {
        console.error('❌ Erreur intercepteur de requête:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer le rafraîchissement du token
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ Réponse API réussie:', response.config.method?.toUpperCase(), response.config.url, response.status);
        return response;
      },
      async (error) => {
        const originalRequest = (error.config || {}) as RetryableRequestConfig;

        console.error('❌ Erreur API:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);

        if (error.response?.status !== 401 || !originalRequest) {
          return Promise.reject(error);
        }

        const requestUrl = originalRequest.url || '';
        const shouldSkipRefresh = this.shouldSkipRefresh(requestUrl);

        if (shouldSkipRefresh || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!this.isRefreshing) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          this.isRefreshing = true;
          this.refreshPromise = this.performRefresh();
        }

        try {
          const newAccessToken = await this.refreshPromise;
          if (newAccessToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            console.log('✅ Token rafraîchi avec succès, relance de la requête');
            return this.client(originalRequest);
          }

          throw new Error('No access token received');
        } catch (refreshError) {
          console.error('❌ Échec du rafraîchissement du token:', refreshError);
          this.clearAuthAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          if (this.isRefreshing) {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('refresh_token');
  }

  private shouldSkipRefresh(url: string): boolean {
    return (
      url.includes('/auth/login/') ||
      url.includes('/auth/token/refresh/') ||
      url.includes('/auth/verify-otp/') ||
      url.includes('/auth/resend-otp/')
    );
  }

  // Méthode pour effectuer le refresh du token
  private async performRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Le refresh utilise axios brut pour éviter de repasser dans cet intercepteur.
      const response = await axios.post(`${formattedApiUrl}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      
      const newAccessToken = response.data?.data?.access;
      const rotatedRefreshToken = response.data?.data?.refresh;
      if (newAccessToken) {
        localStorage.setItem('access_token', newAccessToken);

        if (rotatedRefreshToken) {
          localStorage.setItem('refresh_token', rotatedRefreshToken);
        }

        if (typeof window !== 'undefined') {
          document.cookie = `access_token=${newAccessToken}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE}`;
          if (rotatedRefreshToken) {
            document.cookie = `refresh_token=${rotatedRefreshToken}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE}`;
          }
        }

        return newAccessToken;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Méthode pour nettoyer l'auth et rediriger
  private clearAuthAndRedirect(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    window.location.href = '/login';
  }

  // Méthodes HTTP génériques
  async get<T>(url: string, params?: any): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.delete(url);
    return response.data;
  }

  // Upload de fichiers
  async upload<T>(url: string, formData: FormData): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadPut<T>(url: string, formData: FormData): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.put(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadPatch<T>(url: string, formData: FormData): Promise<StandardApiResponse<T>> {
    const response: AxiosResponse<StandardApiResponse<T>> = await this.client.patch(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
