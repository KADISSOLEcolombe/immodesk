"use client";

import { FormEvent, useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  AlertCircle,
  Info,
  Home,
  CreditCard,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { NotificationsService } from '@/lib/notifications-service';

const typeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  quittance: { icon: FileText, label: 'Quittance', color: 'text-blue-600', bg: 'bg-blue-50' },
  alerte: { icon: AlertCircle, label: 'Alerte', color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: Info, label: 'Info', color: 'text-slate-600', bg: 'bg-slate-50' },
  paiement: { icon: CreditCard, label: 'Paiement', color: 'text-green-600', bg: 'bg-green-50' },
  bail: { icon: Home, label: 'Bail', color: 'text-purple-600', bg: 'bg-purple-50' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function OwnerNotificationsPage() {
  const {
    filteredNotifications,
    filteredUnreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [adminMessage, setAdminMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications au montage
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Supprimer une notification
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteNotification(id);
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // Envoyer message admin (frontend seulement)
  const sendAdminMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminMessage.trim()) return;
    alert('Message envoyé à l\'administrateur');
    setAdminMessage('');
  };

  // Télécharger quittance
  const handleDownloadQuittance = async (paiementId: string) => {
    try {
      const blob = await NotificationsService.downloadQuittance(paiementId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance_${paiementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Erreur lors du téléchargement');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-900">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Notifications</h1>
          {filteredUnreadCount > 0 && (
            <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
              {filteredUnreadCount}
            </span>
          )}
        </div>
        {filteredUnreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Liste des notifications */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <span className="ml-2 text-sm text-zinc-500">Chargement...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-500">Aucune notification pour le moment</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.info;
              const Icon = config.icon;

              return (
                <li
                  key={notification.id}
                  className={`group relative rounded-xl border p-4 transition ${
                    notification.lue
                      ? 'border-zinc-100 bg-zinc-50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône type */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium ${notification.lue ? 'text-zinc-600' : 'text-zinc-900'}`}>
                            {notification.titre}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-500">{notification.message}</p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-400">
                          {formatDate(notification.date_envoi)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        {!notification.lue && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                          >
                            <Check className="h-3 w-3" />
                            Marquer comme lu
                          </button>
                        )}

                        {notification.lien && (
                          <a
                            href={notification.lien}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Voir
                          </a>
                        )}

                        {notification.type === 'quittance' && (
                          <button
                            onClick={() => handleDownloadQuittance(notification.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                          >
                            <FileText className="h-3 w-3" />
                            Télécharger
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={deletingId === notification.id}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingId === notification.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Indicateur non-lu */}
                    {!notification.lue && (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-zinc-900" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Formulaire contact admin */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Contacter l&apos;admin</h2>
        <form onSubmit={sendAdminMessage} className="space-y-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Votre message
            <input
              type="text"
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Ex: Merci de valider le nouveau bien"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Envoyer
          </button>
        </form>
      </section>
    </>
  );
}
