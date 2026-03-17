"use client";

import { FormEvent, useState } from 'react';
import { Bell, CircleDollarSign } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const ownerNotifications = [
  '1 loyer est en retard sur le studio de Kara.',
  'Nouvelle demande de visite reçue pour le T2 de Kpalimé.',
  'Message système: maintenance planifiée vendredi à Tsévié.',
];

export default function OwnerNotificationsPage() {
  const { addNotification, unreadCount } = useNotifications();
  const [adminMessage, setAdminMessage] = useState('');

  const sendAdminMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminMessage.trim()) return;
    addNotification({ category: 'message', title: `Message propriétaire vers admin: ${adminMessage.trim()}` });
    setAdminMessage('');
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Bell className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>
        )}
      </div>

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <ul className="space-y-3">
          {ownerNotifications.map((notification, index) => (
            <li key={`${notification}-${index}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
              {notification}
            </li>
          ))}
        </ul>
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500">
          <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          Messages système et alertes financières actualisés quotidiennement.
        </p>
      </section>

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
