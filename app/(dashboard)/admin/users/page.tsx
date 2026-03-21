"use client";

import { FormEvent, useState } from 'react';
import { Users } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useReports } from '@/components/reports/ReportProvider';

type UserRole = 'tenant' | 'owner' | 'admin';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
};

const initialUsers: ManagedUser[] = [
  { id: 'u-1', fullName: 'Afi Koutou', email: 'afi@immodesk.tg', role: 'tenant', active: true },
  { id: 'u-2', fullName: 'Kossi Mensah', email: 'kossi@immodesk.tg', role: 'tenant', active: true },
  { id: 'u-3', fullName: 'Nora Agbeko', email: 'nora@immodesk.tg', role: 'owner', active: true },
  { id: 'u-4', fullName: 'Admin Central', email: 'admin@immodesk.tg', role: 'admin', active: true },
];

export default function AdminUsersPage() {
  const { addNotification } = useNotifications();
  const { exportTableReport } = useReports();

  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [userFeedback, setUserFeedback] = useState('');

  const createUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    const newUser: ManagedUser = {
      id: `u-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      active: true,
    };

    setUsers((current) => [newUser, ...current]);
    setUserFeedback('Compte créé avec succès.');
    addNotification({
      category: 'system',
      title: `Nouveau compte créé (${newUser.role}) : ${newUser.fullName}.`,
    });

    setFullName('');
    setEmail('');
    setPassword('');
    setRole('tenant');
  };

  const toggleActive = (id: string) => {
    setUsers((current) =>
      current.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    );
  };

  const exportUsers = () => {
    exportTableReport({
      title: 'Tableau utilisateurs',
      role: 'admin',
      generatedBy: 'super_admin',
      headers: ['Nom', 'Email', 'Rôle', 'Statut'],
      rows: users.map((u) => [u.fullName, u.email, u.role, u.active ? 'Actif' : 'Inactif']),
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Users className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <button
          type="button"
          onClick={exportUsers}
          className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Exporter PDF
        </button>
      </div>

      {/* Création compte */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Créer un compte</h2>
        <form onSubmit={createUser} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
            Nom complet
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom et prénom"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="utilisateur@immodesk.tg"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Définir un mot de passe"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Rôle
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            >
              <option value="tenant">Locataire</option>
              <option value="owner">Propriétaire</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Créer le compte
          </button>
        </form>
        {userFeedback && <p className="mt-3 text-sm font-medium text-green-700">{userFeedback}</p>}
      </section>

      {/* Liste utilisateurs */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Liste des comptes ({users.length})</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <article key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{user.fullName}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
                <p className="mt-0.5 text-xs text-zinc-700">
                  Rôle: <strong>{user.role}</strong> ·{' '}
                  <span className={user.active ? 'text-green-700' : 'text-red-600'}>
                    {user.active ? 'Actif' : 'Inactif'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleActive(user.id)}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                {user.active ? 'Désactiver' : 'Réactiver'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
