"use client";

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const categoryLabel = {
  quittance: 'Quittance',
  alerte: 'Alerte',
  info: 'Information',
  paiement: 'Paiement',
  bail: 'Bail',
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="mt-2 w-[min(92vw,360px)] rounded-2xl border border-black/5 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Tout marquer lu
            </button>
          </div>

          <ul className="max-h-80 space-y-2 overflow-auto pr-1">
            {notifications.map((item) => (
              <li 
                key={item.id} 
                className={`rounded-xl border p-2.5 ${item.lue ? 'border-zinc-100 bg-zinc-50' : 'border-zinc-200 bg-white'}`}
                onClick={() => !item.lue && markAsRead(item.id)}
              >
                <p className="text-xs font-medium text-zinc-500">{categoryLabel[item.type]}</p>
                <p className="text-sm font-medium text-zinc-800">{item.titre}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.message}</p>
                <p className="mt-1 text-[11px] text-zinc-400">{new Date(item.date_envoi).toLocaleString('fr-FR')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
