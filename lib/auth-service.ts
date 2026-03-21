import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { User, LoginCredentials, RegisterData } from '@/types/api';

interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export class AuthService {
  // Stockage des tokens
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  // Connexion - CORRIGÉ
  static async login(credentials: LoginCredentials): Promise<StandardApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
      
      console.log('📦 Réponse reçue:', response); // Pour debug
      
      if (response.success) {
        // Récupérer les tokens - supporte les deux structures possibles
        let accessToken: string | undefined;
        let refreshToken: string | undefined;
        let user: User | undefined;
        
        // Structure 1: response.userContext.tokens
        if (response.userContext?.tokens) {
          accessToken = response.userContext.tokens.access;
          refreshToken = response.userContext.tokens.refresh;
          user = response.userContext.user;
        }
        // Structure 2: response.data (tokens directement dans data)
        else if (response.data) {
          // Si les tokens sont dans response.data
          if (typeof response.data === 'object') {
            accessToken = (response.data as any).access || (response.data as any).tokens?.access;
            refreshToken = (response.data as any).refresh || (response.data as any).tokens?.refresh;
            user = (response.data as any).user;
          }
        }
        
        if (accessToken && refreshToken) {
          // Stocker les tokens
          localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
          
          // Stocker l'utilisateur si disponible
          if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          }
          
          // Stocker dans les cookies pour le middleware
          if (typeof window !== 'undefined') {
            document.cookie = `access_token=${accessToken}; path=/; max-age=900`; // 15 minutes
            document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800`; // 7 jours
            if (user?.role) {
              document.cookie = `user_role=${user.role}; path=/; max-age=604800`; // 7 jours
            }
          }
          
          console.log('✅ Connexion réussie, tokens stockés');
        } else {
          console.error('❌ Tokens non trouvés dans la réponse:', response);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Inscription (uniquement pour super admin)
  static async register(data: RegisterData): Promise<StandardApiResponse<User>> {
    try {
      return await apiClient.post<User>('/auth/register/', data);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Déconnexion
  static async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Nettoyer le stockage local même si l'appel API échoue
      this.clearStorage();
      // Nettoyer également les cookies
      if (typeof window !== 'undefined') {
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
  }

  // Obtenir le profil utilisateur
  static async getCurrentUser(): Promise<StandardApiResponse<User>> {
    try {
      return await apiClient.get<User>('/auth/me/');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Rafraîchir le token
  static async refreshToken(): Promise<StandardApiResponse<{ access: string }>> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.post<{ access: string }>('/auth/token/refresh/', {
        refresh: refreshToken,
      });
      
      if (response.success && response.data) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.data.access);
        
        // Mettre à jour le cookie également
        if (typeof window !== 'undefined') {
          document.cookie = `access_token=${response.data.access}; path=/; max-age=900`; // 15 minutes
        }
      }
      
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearStorage();
      // Nettoyer également les cookies
      if (typeof window !== 'undefined') {
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      throw error;
    }
  }

  // Vérifier si l'utilisateur est authentifié
  static isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    return !!token;
  }

  // Obtenir l'utilisateur connecté
  static getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }

  // Obtenir le rôle de l'utilisateur
  static getUserRole(): string | null {
    const user = this.getCurrentUserFromStorage();
    return user?.role || null;
  }

  // Vérifier si l'utilisateur est super admin
  static isSuperAdmin(): boolean {
    return this.getUserRole() === 'superadmin';
  }

  // Vérifier si l'utilisateur est propriétaire
  static isOwner(): boolean {
    return this.getUserRole() === 'proprietaire';
  }

  // Vérifier si l'utilisateur est locataire
  static isTenant(): boolean {
    return this.getUserRole() === 'locataire';
  }

  // Obtenir le token d'accès
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Obtenir le token de rafraîchissement
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Nettoyer le stockage local
  static clearStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Initialiser l'authentification au chargement de l'app
  static initializeAuth(): User | null {
    if (this.isAuthenticated()) {
      return this.getCurrentUserFromStorage();
    }
    return null;
  }

  // Vérifier et synchroniser les tokens avec les cookies (utile après rechargement)
  static syncTokensFromCookies(): void {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let userRole: string | null = null;

      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') accessToken = value;
        if (name === 'refresh_token') refreshToken = value;
        if (name === 'user_role') userRole = value;
      });

      // Synchroniser avec localStorage si nécessaire
      if (accessToken && !localStorage.getItem(this.ACCESS_TOKEN_KEY)) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      }
      if (refreshToken && !localStorage.getItem(this.REFRESH_TOKEN_KEY)) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  }
}