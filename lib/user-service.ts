import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { UserRole } from '@/types/api';

// Type pour la création d'utilisateur avec les champs complets du backend
export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  canal_2fa?: 'mail' | 'sms';
  phone_number?: string;
}

// Type pour l'utilisateur avec les champs retournés par le backend
export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  canal_2fa: 'mail' | 'sms';
  phone_number: string | null;
  created_at: string;
  notifications_non_lues: number;
  is_active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  canal_2fa?: 'mail' | 'sms';
  phone_number?: string;
}

export class UserService {
  // Lister tous les utilisateurs (Super Admin uniquement)
  static async getAllUsers(): Promise<StandardApiResponse<UserResponse[]>> {
    try {
      return await apiClient.get<UserResponse[]>('/auth/users/');
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Récupérer un utilisateur par son ID (Super Admin uniquement)
  static async getUserById(userId: string): Promise<StandardApiResponse<UserResponse>> {
    try {
      return await apiClient.get<UserResponse>(`/auth/users/${userId}/`);
    } catch (error) {
      console.error('Get user by id error:', error);
      throw error;
    }
  }

  // Créer un utilisateur (Super Admin uniquement)
  static async createUser(data: CreateUserData): Promise<StandardApiResponse<{ message: string }>> {
    try {
      return await apiClient.post<{ message: string }>('/auth/register/', data);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Modifier un utilisateur (Super Admin uniquement)
  static async updateUser(userId: string, data: UpdateUserData): Promise<StandardApiResponse<UserResponse>> {
    try {
      return await apiClient.put<UserResponse>(`/auth/users/${userId}/modifier/`, data);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  // Désactiver un utilisateur (Super Admin uniquement)
  static async desactivateUser(userId: string): Promise<StandardApiResponse<{ message: string }>> {
    try {
      return await apiClient.patch<{ message: string }>(`/auth/users/${userId}/desactiver/`);
    } catch (error) {
      console.error('Desactivate user error:', error);
      throw error;
    }
  }

  // Réactiver un utilisateur (Super Admin uniquement)
  static async reactivateUser(userId: string): Promise<StandardApiResponse<{ message: string }>> {
    try {
      return await apiClient.patch<{ message: string }>(`/auth/users/${userId}/reactiver/`);
    } catch (error) {
      console.error('Reactivate user error:', error);
      throw error;
    }
  }

  // Récupérer le profil de l'utilisateur connecté
  static async getCurrentUser(): Promise<StandardApiResponse<UserResponse>> {
    try {
      return await apiClient.get<UserResponse>('/auth/me/');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Helper pour convertir les rôles frontend vers backend
  static mapFrontendRoleToBackend(frontendRole: 'tenant' | 'owner' | 'admin'): UserRole {
    const mapping: Record<string, UserRole> = {
      'tenant': 'locataire',
      'owner': 'proprietaire',
      'admin': 'superadmin',
    };
    return mapping[frontendRole] || 'locataire';
  }

  // Helper pour convertir les rôles backend vers frontend
  static mapBackendRoleToFrontend(backendRole: UserRole): 'tenant' | 'owner' | 'admin' {
    const mapping: Record<UserRole, 'tenant' | 'owner' | 'admin'> = {
      'locataire': 'tenant',
      'proprietaire': 'owner',
      'superadmin': 'admin',
    };
    return mapping[backendRole] || 'tenant';
  }
}
