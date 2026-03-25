"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Send } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { NotificationsService, AlertMode } from '@/lib/notifications-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { UserResponse, UserService } from '@/lib/user-service';
import { Bien } from '@/types/api';

export default function AdminNotificationsPage() {
  const { addNotification } = useNotifications();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modeEnvoi, setModeEnvoi] = useState<AlertMode>('individuel');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedBienId, setSelectedBienId] = useState<string>('');
  const [message, setMessage] = useState('');

  const availableRecipients = useMemo(
    () => users.filter((user) => user.role === 'locataire' || user.role === 'proprietaire'),
    [users],
  );

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setIsLoadingMeta(true);
        const [usersResponse, biensResponse] = await Promise.all([
          UserService.getAllUsers(),
          PatrimoineService.getBiens(),
        ]);

        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }

        if (biensResponse.success && biensResponse.data) {
          setBiens(biensResponse.data);
        }
      } catch (error) {
        addNotification({
          type: 'alerte',
          titre: 'Erreur chargement des donnees',
          message: '',
        });
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  const toggleRecipient = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  const resetForm = () => {
    setModeEnvoi('individuel');
    setSelectedUserIds([]);
    setSelectedBienId('');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      addNotification({
        type: 'alerte',
        titre: 'Message requis',
        message: '',
      });
      return;
    }

    if (modeEnvoi !== 'diffusion' && selectedUserIds.length === 0) {
      addNotification({
        type: 'alerte',
        titre: 'Selectionne au moins un destinataire',
        message: '',
      });
      return;
    }

    if (modeEnvoi === 'individuel' && selectedUserIds.length !== 1) {
      addNotification({
        type: 'alerte',
        titre: 'Mode individuel: selectionne un seul destinataire',
        message: '',
      });
      return;
    }

    if (modeEnvoi === 'multidiffusion' && selectedUserIds.length < 2) {
      addNotification({
        type: 'alerte',
        titre: 'Mode multidiffusion: selectionne au moins 2 destinataires',
        message: '',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await NotificationsService.sendAdminAlert({
        message: message.trim(),
        mode_envoi: modeEnvoi,
        destinataires: modeEnvoi === 'diffusion' ? [] : selectedUserIds,
        bien_id: selectedBienId || null,
      });

      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: response.message || 'Envoi alerte echoue',
          message: '',
        });
        return;
      }

      const sentCount = response.data?.alertes_envoyees ?? 0;
      addNotification({
        type: 'info',
        titre: `Alerte envoyee (${sentCount} destinataire(s))`,
        message: '',
      });

      resetForm();
    } catch (error) {
      addNotification({
        type: 'alerte',
        titre: 'Erreur serveur lors de l envoi',
        message: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-zinc-900">
        <Bell className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Envoi notifications / alertes</h1>
      </div>

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {isLoadingMeta ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-zinc-600">
                Mode d'envoi
                <select
                  value={modeEnvoi}
                  onChange={(event) => {
                    setModeEnvoi(event.target.value as AlertMode);
                    setSelectedUserIds([]);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <option value="individuel">Individuel</option>
                  <option value="multidiffusion">Multidiffusion</option>
                  <option value="diffusion">Diffusion</option>
                </select>
              </label>

              <label className="text-xs font-medium text-zinc-600">
                Bien concerne (optionnel)
                <select
                  value={selectedBienId}
                  onChange={(event) => setSelectedBienId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <option value="">Aucun</option>
                  {biens.map((bien) => (
                    <option key={bien.id} value={bien.id}>
                      {bien.titre || bien.adresse || bien.adresse_complete || bien.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {modeEnvoi !== 'diffusion' && (
              <div>
                <p className="text-xs font-medium text-zinc-600">Destinataires</p>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  {availableRecipients.map((user) => {
                    const isChecked = selectedUserIds.includes(user.id);
                    return (
                      <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-zinc-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecipient(user.id)}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        <span>
                          {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
                          <span className="ml-1 text-xs text-zinc-500">({user.role})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {modeEnvoi === 'individuel'
                    ? 'Selectionne un seul utilisateur.'
                    : 'Selectionne plusieurs utilisateurs.'}
                </p>
              </div>
            )}

            <label className="block text-xs font-medium text-zinc-600">
              Message
              <textarea
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                placeholder="Saisis le contenu de l'alerte..."
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Reinitialiser
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isSubmitting ? 'Envoi...' : 'Envoyer alerte'}
              </button>
            </div>
          </form>
        )}
      </article>
    </section>
  );
}
