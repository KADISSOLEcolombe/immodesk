"use client";

import { Bell } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const staticNotifications = [
  { id: 'tn-1', title: 'Rappel: échéance du loyer le 5 de chaque mois.', date: '03 mars 2026' },
  { id: 'tn-2', title: 'Maintenance programmée jeudi prochain.', date: '28 février 2026' },
];

export default function TenantNotificationsPage() {
  const { unreadCount } = useNotifications();

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Bell className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>
        )}
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {staticNotifications.length === 0 && <p className="text-sm text-zinc-500">Aucune notification pour le moment.</p>}
        <ul className="space-y-3">
          {staticNotifications.map((item) => (
            <li key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-sm text-zinc-800">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.date}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
