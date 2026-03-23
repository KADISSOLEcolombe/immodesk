"use client";

import { FormEvent, useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useReports } from '@/components/reports/ReportProvider';
import { UserService, CreateUserData, UserResponse } from '@/lib/user-service';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [userFeedback, setUserFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

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
          category: 'system',
          title: 'Erreur lors du chargement des utilisateurs',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({
        category: 'system',
        title: 'Erreur de connexion au serveur',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErrorFeedback('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setErrorFeedback('');
    setUserFeedback('');

    try {
      const userData: CreateUserData = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: UserService.mapFrontendRoleToBackend(role),
        canal_2fa: 'mail', // Par défaut
      };

      const response = await UserService.createUser(userData);

      if (response.success) {
        // Rafraîchir la liste des utilisateurs
        await fetchUsers();
        
        setUserFeedback('Compte créé avec succès.');
        addNotification({
          category: 'system',
          title: `Nouveau compte créé (${role}) : ${firstName} ${lastName}.`,
        });

        // Réinitialiser le formulaire
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setRole('tenant');
      } else {
        const errorMsg = response.errors?.[0]?.message || response.message || 'Erreur lors de la création';
        setErrorFeedback(errorMsg);
        addNotification({
          category: 'system',
          title: `Erreur: ${errorMsg}`,
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorFeedback('Erreur de connexion au serveur.');
      addNotification({
        category: 'system',
        title: 'Erreur de connexion au serveur',
      });
    } finally {
      setIsSubmitting(false);
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
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Prénom
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Nom
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Définir un mot de passe (min. 8 caractères)"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Rôle
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={isSubmitting}
            >
              <option value="tenant">Locataire</option>
              <option value="owner">Propriétaire</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer le compte'
            )}
          </button>
        </form>
        {userFeedback && <p className="mt-3 text-sm font-medium text-green-700">{userFeedback}</p>}
        {errorFeedback && <p className="mt-3 text-sm font-medium text-red-600">{errorFeedback}</p>}
      </section>

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
              <article key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{user.fullName}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <p className="mt-0.5 text-xs text-zinc-700">
                    Rôle: <strong>{getRoleLabel(user.role)}</strong> ·{' '}
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
        )}
      </section>
    </>
  );
}
