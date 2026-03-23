"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useReports } from '@/components/reports/ReportProvider';
import { UserService, UserResponse } from '@/lib/user-service';

type UserRole = 'tenant' | 'owner' | 'admin';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export default function AdminUsersPage() {
  const { addNotification } = useNotifications();
  const { exportTableReport } = useReports();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la liste des utilisateurs au montage
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await UserService.getAllUsers();
      
      if (response.success && response.data) {
        const mappedUsers: ManagedUser[] = response.data.map((user: UserResponse) => ({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: UserService.mapBackendRoleToFrontend(user.role),
          active: true, // Par défaut, on considère que les utilisateurs sont actifs
        }));
        setUsers(mappedUsers);
      } else {
        addNotification({
          type: 'alerte',
          titre: 'Erreur lors du chargement des utilisateurs',
          message: '',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({
        type: 'alerte',
        titre: 'Erreur de connexion au serveur',
        message: '',
      });
    } finally {
      setIsLoading(false);
    }
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

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      tenant: 'Locataire',
      owner: 'Propriétaire',
      admin: 'Admin',
    };
    return labels[role];
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Users className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Créer un utilisateur
          </Link>
          <button
            type="button"
            onClick={exportUsers}
            className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Liste utilisateurs */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Liste des comptes {isLoading && '(Chargement...)'}
        </h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <article key={user.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:border-zinc-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/users/${user.id}`} className="block rounded-lg p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
                  <p className="text-sm font-medium text-zinc-900">{user.fullName}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <p className="mt-0.5 text-xs text-zinc-700">
                    Rôle: <strong>{getRoleLabel(user.role)}</strong> ·{' '}
                    <span className={user.active ? 'text-green-700' : 'text-red-600'}>
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Voir détails
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleActive(user.id)}
                    className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    {user.active ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
