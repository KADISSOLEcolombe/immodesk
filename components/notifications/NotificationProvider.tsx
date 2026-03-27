"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AuthService } from '@/lib/auth-service';

import { NotificationsService } from '@/lib/services';

export type NotificationCategory = 'quittance' | 'alerte' | 'info' | 'paiement' | 'bail';

export type UserRole = 'locataire' | 'proprietaire' | 'superadmin';

// Types de notifications autorisés par rôle
const ALLOWED_TYPES_BY_ROLE: Record<UserRole, NotificationCategory[]> = {
  locataire: ['quittance', 'paiement', 'info', 'alerte'],
  proprietaire: ['bail', 'info', 'alerte', 'paiement'],
  superadmin: ['quittance', 'alerte', 'info', 'paiement', 'bail'],
};

export type AppNotification = {
  id: string;
  titre: string;
  message: string;
  type: NotificationCategory;
  date_envoi: string;
  lue: boolean;
  lien?: string;
};

type NotificationInput = {
  titre: string;
  message: string;
  type: NotificationCategory;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  filteredNotifications: AppNotification[];
  unreadCount: number;
  filteredUnreadCount: number;
  userRole: UserRole | null;
  addNotification: (payload: NotificationInput) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
};

// Notifications initiales vides - chargées depuis le backend
const initialNotifications: AppNotification[] = [];

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Fonction pour obtenir la clé de stockage spécifique à l'utilisateur
const getStorageKey = (userId: string | null): string => {
  if (!userId) return 'immodesk.notifications.guest';
  return `immodesk.notifications.user.${userId}`;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isFetching = useRef(false);

  // Charger le rôle et l'ID de l'utilisateur au montage
  useEffect(() => {
    const role = AuthService.getUserRole() as UserRole | null;
    const user = AuthService.getCurrentUserFromStorage();
    setUserRole(role);
    
    const newUserId = user?.id || null;
    
    // Si l'utilisateur a changé, réinitialiser les notifications
    if (userId !== null && newUserId !== userId) {
      setNotifications([]);
      setUnreadCount(0);
    }
    
    setUserId(newUserId);
  }, [userId]);

  // Charger les notifications depuis localStorage pour cet utilisateur
  useEffect(() => {
    if (!userId) {
      setIsHydrated(true);
      return;
    }

    try {
      const storageKey = getStorageKey(userId);
      const rawValue = window.localStorage.getItem(storageKey);

      if (!rawValue) {
        setIsHydrated(true);
        return;
      }

      const parsedValue = JSON.parse(rawValue) as AppNotification[];
      if (Array.isArray(parsedValue)) {
        setNotifications(parsedValue);
      }
    } catch {
      const storageKey = getStorageKey(userId);
      window.localStorage.removeItem(storageKey);
    } finally {
      setIsHydrated(true);
    }
  }, [userId]);

  // Sauvegarder les notifications dans localStorage pour cet utilisateur
  useEffect(() => {
    if (!isHydrated || !userId) {
      return;
    }

    const storageKey = getStorageKey(userId);
    window.localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, isHydrated, userId]);

  // Rafraîchir les notifications depuis le backend - stable reference
  const refreshNotifications = useCallback(async () => {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    const role = (AuthService.getUserRole() as UserRole | null) || userRole;
    if (role === 'superadmin') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Avoid concurrent calls using ref (doesn't trigger re-render)
    if (isFetching.current) {
      return;
    }

    isFetching.current = true;
    setIsLoading(true);
    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        NotificationsService.getNotifications(),
        NotificationsService.countUnread(),
      ]);

      if (notificationsResponse.success && notificationsResponse.data) {
        setNotifications((currentNotifications) => {
          const backendNotifications = notificationsResponse.data || [];
          
          // Séparer les notifications locales (créées via addNotification) des notifications backend
          const localNotifications = currentNotifications.filter(n => n.id.startsWith('n-'));
          const backendIds = new Set(backendNotifications.map(n => n.id));
          
          // Garder uniquement les notifications locales qui ne sont pas dans le backend
          const uniqueLocalNotifications = localNotifications.filter(n => !backendIds.has(n.id));
          
          // Fusionner: notifications locales d'abord, puis backend
          return [...uniqueLocalNotifications, ...backendNotifications];
        });
      }

      if (unreadResponse.success && unreadResponse.data) {
        setUnreadCount(Number(unreadResponse.data.count ?? 0));
      } else if (notificationsResponse.success && notificationsResponse.data) {
        // Compter aussi les notifications locales non lues
        setNotifications((current) => {
          const unread = current.filter((item) => !item.lue).length;
          setUnreadCount(unread);
          return current;
        });
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des notifications:', error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [userRole]);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = (payload: NotificationInput) => {
    const now = new Date();
    const date_envoi = now.toISOString();

    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        titre: payload.titre,
        message: payload.message,
        type: payload.type,
        date_envoi,
        lue: false,
      },
      ...current,
    ]);
    setUnreadCount((current) => current + 1);
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await NotificationsService.markAsRead(id);
      if (response.success) {
        setNotifications((current) => {
          const target = current.find((item) => item.id === id);
          if (target && !target.lue) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }

          return current.map((item) => (item.id === id ? { ...item, lue: true } : item));
        });
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await NotificationsService.markAllAsRead();
      if (response.success) {
        setNotifications((current) => current.map((item) => ({ ...item, lue: true })));
        setUnreadCount(0);
      } else {
        setNotifications((current) => current.map((item) => ({ ...item, lue: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      setNotifications((current) => current.map((item) => ({ ...item, lue: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await NotificationsService.deleteNotification(id);
      if (response.success) {
        setNotifications((current) => {
          const target = current.find((item) => item.id === id);
          if (target && !target.lue) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return current.filter((item) => item.id !== id);
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de notification:', error);
      throw error;
    }
  };

  const value = useMemo(() => {
    // Filtrer les notifications selon le rôle
    const allowedTypes = userRole ? ALLOWED_TYPES_BY_ROLE[userRole] : [];
    const filteredNotifications = notifications.filter((item) =>
      allowedTypes.includes(item.type)
    );

    const filteredUnreadCount = filteredNotifications.filter((item) => !item.lue).length;

    return {
      notifications,
      filteredNotifications,
      unreadCount,
      filteredUnreadCount,
      userRole,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications,
      isLoading,
    };
  }, [notifications, unreadCount, isLoading, userRole, refreshNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
}
