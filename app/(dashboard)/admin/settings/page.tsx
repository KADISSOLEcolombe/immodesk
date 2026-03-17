"use client";

import { FormEvent, useState } from 'react';
import { CheckCircle2, Settings2, Shield, XCircle } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

export default function AdminSettingsPage() {
  const { addNotification } = useNotifications();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [defaultCity, setDefaultCity] = useState('Lomé');
  const [supportEmail, setSupportEmail] = useState('support@immodesk.tg');
  const [configFeedback, setConfigFeedback] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const saveConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportEmail.trim()) return;
    setConfigFeedback('Configuration enregistrée.');
    addNotification({ category: 'system', title: 'Configuration système mise à jour.' });
  };

  const sendBroadcast = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!broadcastMessage.trim()) return;
    addNotification({ category: 'message', title: `Message admin diffusé: ${broadcastMessage.trim()}` });
    setBroadcastMessage('');
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Settings2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Configuration système</h1>
      </div>

      {/* Paramètres */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paramètres généraux</h2>
        <form onSubmit={saveConfiguration} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Ville par défaut
            <select
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            >
              <option value="Lomé">Lomé</option>
              <option value="Kara">Kara</option>
              <option value="Kpalimé">Kpalimé</option>
              <option value="Sokodé">Sokodé</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email support
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Inscriptions ouvertes
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Mode maintenance
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Sauvegarder la configuration
            </button>

            {maintenanceMode ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Système en maintenance
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Système opérationnel
              </p>
            )}

            {registrationOpen ? (
              <p className="inline-flex items-center gap-1.5 text-sm text-zinc-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Nouvelles inscriptions autorisées
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm text-zinc-600">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Inscriptions temporairement fermées
              </p>
            )}
          </div>
        </form>

        {configFeedback && <p className="mt-3 text-sm font-medium text-green-700">{configFeedback}</p>}
      </section>

      {/* Diffusion */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Diffuser un message</h2>
        <form onSubmit={sendBroadcast} className="space-y-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Message admin/propriétaire
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Ex: Merci de mettre à jour vos dossiers avant vendredi"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Diffuser le message
          </button>
        </form>
      </section>
    </>
  );
}
