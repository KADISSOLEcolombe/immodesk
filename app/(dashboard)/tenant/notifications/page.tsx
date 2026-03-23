"use client";

import { useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  AlertTriangle,
  Info,
  CreditCard,
  Home,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications, NotificationCategory } from '@/components/notifications/NotificationProvider';

// Icône selon le type de notification
const getNotificationIcon = (type: NotificationCategory) => {
  switch (type) {
    case 'quittance': return <FileText className="h-5 w-5 text-blue-600" />;
    case 'alerte': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'paiement': return <CreditCard className="h-5 w-5 text-emerald-600" />;
    case 'bail': return <Home className="h-5 w-5 text-purple-600" />;
    case 'info':
    default: return <Info className="h-5 w-5 text-zinc-600" />;
  }
};

// Couleur de fond selon le type
const getNotificationBg = (type: NotificationCategory) => {
  switch (type) {
    case 'quittance': return 'bg-blue-50 border-blue-200';
    case 'alerte': return 'bg-amber-50 border-amber-200';
    case 'paiement': return 'bg-emerald-50 border-emerald-200';
    case 'bail': return 'bg-purple-50 border-purple-200';
    case 'info':
    default: return 'bg-zinc-50 border-zinc-200';
  }
};

// Formater la date relative
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TenantNotificationsPage() {
  const { 
    filteredNotifications, 
    filteredUnreadCount, 
    isLoading, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead,
    userRole 
  } = useNotifications();

  // Charger les notifications au montage
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-zinc-900">
          <div className="relative">
            <Bell className="h-6 w-6" aria-hidden="true" />
            {filteredUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-zinc-500">
              {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
              {filteredUnreadCount > 0 && ` · ${filteredUnreadCount} non lue${filteredUnreadCount > 1 ? 's' : ''}`}
              {userRole && (
                <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {userRole === 'locataire' ? 'Locataire' : userRole === 'proprietaire' ? 'Propriétaire' : 'Admin'}
                </span>
              )}
            </p>
          </div>
        </div>

        {filteredNotifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={filteredUnreadCount === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </header>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
              <Bell className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">Aucune notification</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Vous n&apos;avez pas encore de notifications pour votre rôle ({userRole === 'locataire' ? 'Locataire' : userRole === 'proprietaire' ? 'Propriétaire' : 'Admin'}).
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredNotifications.map((item) => (
              <li
                key={item.id}
                className={`group relative rounded-2xl border p-4 transition hover:shadow-sm ${
                  item.lue
                    ? getNotificationBg(item.type)
                    : `border-zinc-900 bg-zinc-50 shadow-sm ${getNotificationBg(item.type).split(' ')[0].replace('50', '100')}`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className={`flex-shrink-0 rounded-xl p-2 ${item.lue ? 'bg-white' : 'bg-white shadow-sm'}`}>
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-medium ${item.lue ? 'text-zinc-800' : 'text-zinc-900'}`}>
                          {item.titre}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">{item.message}</p>
                        <p className="mt-2 text-xs text-zinc-400">{formatDate(item.date_envoi)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {!item.lue && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {item.lien && (
                          <a
                            href={item.lien}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                            title="Ouvrir le lien"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge non lue */}
                  {!item.lue && (
                    <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-zinc-900" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
