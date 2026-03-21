import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types pour les réponses standardisées du backend Django
export interface StandardApiResponse<T = any> {
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
    details: any;
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

console.log('🔗 API URL configurée:', formattedApiUrl);

class ApiClient {
  private client: AxiosInstance;

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
        const token = localStorage.getItem('access_token');
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
        const originalRequest = error.config;

        console.error('❌ Erreur API:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);

        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.post<{ access: string }>('/auth/token/refresh/', {
                refresh: refreshToken,
              });

              const newAccessToken = response.data.data?.access;
              if (newAccessToken) {
                localStorage.setItem('access_token', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                console.log('✅ Token rafraîchi avec succès');
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('❌ Échec du rafraîchissement du token:', refreshError);
            // Échec du rafraîchissement, déconnexion
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            
            // Nettoyer les cookies aussi
            if (typeof window !== 'undefined') {
              document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
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
}

export const apiClient = new ApiClient();
