"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type NotificationCategory = 'payment' | 'message' | 'system';

export type AppNotification = {
  id: string;
  title: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
};

type NotificationInput = {
  title: string;
  category: NotificationCategory;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (payload: NotificationInput) => void;
  markAllAsRead: () => void;
};

const initialNotifications: AppNotification[] = [
  {
    id: 'n-init-1',
    title: 'Alerte paiement: 1 loyer en retard sur le studio de Kara.',
    category: 'payment',
    createdAt: '09 mars 2026 - 09:10',
    read: false,
  },
  {
    id: 'n-init-2',
    title: 'Message admin: vérification des nouveaux dossiers propriétaires.',
    category: 'message',
    createdAt: '09 mars 2026 - 08:45',
    read: false,
  },
];

const NotificationContext = createContext<NotificationContextValue | null>(null);
const STORAGE_KEY = 'immodesk.notifications.v1';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);

      if (!rawValue) {
        setIsHydrated(true);
        return;
      }

      const parsedValue = JSON.parse(rawValue) as AppNotification[];
      if (Array.isArray(parsedValue)) {
        setNotifications(parsedValue);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications, isHydrated]);

  const addNotification = (payload: NotificationInput) => {
    const now = new Date();
    const createdAt = now.toLocaleString('fr-TG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        title: payload.title,
        category: payload.category,
        createdAt,
        read: false,
      },
      ...current,
    ]);
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const value = useMemo(() => {
    const unreadCount = notifications.filter((item) => !item.read).length;

    return {
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
    };
  }, [notifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
}
