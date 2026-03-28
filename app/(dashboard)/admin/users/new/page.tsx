"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { CreateBailPayload, CreateLocatairePayload, LocationsService } from '@/lib/locations-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { UserService, CreateUserData } from '@/lib/user-service';
import { Bien } from '@/types/api';

type UserRole = 'tenant' | 'owner' | 'admin';

const PASSWORD_MIN_LENGTH = 8;

const generateSecurePassword = (length = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specials = '!@#$%^&*()-_=+[]{}';
  const allChars = `${lowercase}${uppercase}${digits}${specials}`;

  if (length < PASSWORD_MIN_LENGTH) {
    return '';
  }

  const getRandomChar = (characters: string): string => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return characters[bytes[0] % characters.length];
  };

  const requiredChars = [
    getRandomChar(lowercase),
    getRandomChar(uppercase),
    getRandomChar(digits),
    getRandomChar(specials),
  ];

  const remainingChars = Array.from({ length: Math.max(length - requiredChars.length, 0) }, () => getRandomChar(allChars));
  const passwordChars = [...requiredChars, ...remainingChars];

  for (let index = passwordChars.length - 1; index > 0; index -= 1) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const swapIndex = bytes[0] % (index + 1);
    [passwordChars[index], passwordChars[swapIndex]] = [passwordChars[swapIndex], passwordChars[index]];
  }

  return passwordChars.join('');
};

export default function AdminUserCreatePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('tenant');
  const [proprietaireId, setProprietaireId] = useState('');
  const [bienId, setBienId] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [profession, setProfession] = useState('');
  const [garantNom, setGarantNom] = useState('');
  const [garantContact, setGarantContact] = useState('');
  const [dateEntree, setDateEntree] = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [loyerMensuel, setLoyerMensuel] = useState('');
  const [depotGarantie, setDepotGarantie] = useState('');
  const [dateRevision, setDateRevision] = useState('');

  const [owners, setOwners] = useState<Array<{ id: string; label: string }>>([]);
  const [properties, setProperties] = useState<Bien[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const [userFeedback, setUserFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const handleGeneratePassword = () => {
    const generatedPassword = generateSecurePassword(12);
    setPassword(generatedPassword);
    setShowPassword(true);
    setErrorFeedback('');
    setUserFeedback('Mot de passe généré automatiquement.');
  };

  useEffect(() => {
    if (role !== 'tenant') {
      return;
    }

    const loadOwners = async () => {
      try {
        setIsLoadingOwners(true);
        const response = await UserService.getAllUsers();
        if (!response.success || !response.data) {
          setErrorFeedback(response.message || 'Impossible de charger les propriétaires.');
          return;
        }

        const mapped = response.data
          .filter((user) => user.role === 'proprietaire' || user.role === 'superadmin')
          .map((user) => ({
            id: user.id,
            label: `${user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email} - ${user.email}`,
          }));
        setOwners(mapped);
      } catch (error) {
        console.error('Erreur chargement propriétaires:', error);
        setErrorFeedback('Erreur de connexion lors du chargement des propriétaires.');
      } finally {
        setIsLoadingOwners(false);
      }
    };

    loadOwners();
  }, [role]);

  useEffect(() => {
    if (role !== 'tenant' || !proprietaireId) {
      setProperties([]);
      return;
    }

    const loadProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const response = await PatrimoineService.getBiens({ proprietaire: proprietaireId });
        if (!response.success || !response.data) {
          setErrorFeedback(response.message || 'Impossible de charger les biens du propriétaire.');
          return;
        }

        const available = response.data.filter((bien) => {
          const rawStatut = String((bien as unknown as Record<string, unknown>).statut || '');
          return rawStatut !== 'loue';
        });

        setProperties(available);
      } catch (error) {
        console.error('Erreur chargement biens:', error);
        setErrorFeedback('Erreur de connexion lors du chargement des biens.');
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, [role, proprietaireId]);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === bienId) || null,
    [properties, bienId],
  );

  const resolveCreatedTenantUserId = async (createdEmail: string): Promise<string | null> => {
    const response = await UserService.getAllUsers();
    if (!response.success || !response.data) {
      return null;
    }

    const target = response.data.find(
      (user) => user.email.toLowerCase() === createdEmail.toLowerCase() && user.role === 'locataire',
    );

    return target?.id || null;
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErrorFeedback('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.trim().length < PASSWORD_MIN_LENGTH) {
      setErrorFeedback(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
      return;
    }

    if (role === 'tenant') {
      if (!proprietaireId || !bienId || !dateEntree || !dateSortie || !loyerMensuel || !depotGarantie) {
        setErrorFeedback('Pour un locataire, propriétaire, bien et champs bail sont obligatoires.');
        return;
      }

      const startDate = new Date(dateEntree);
      const endDate = new Date(dateSortie);
      if (endDate <= startDate) {
        setErrorFeedback('La date de sortie doit être postérieure à la date d entrée.');
        return;
      }

      const loyer = Number(loyerMensuel);
      const depot = Number(depotGarantie);
      if (Number.isNaN(loyer) || Number.isNaN(depot) || loyer < 0 || depot < 0) {
        setErrorFeedback('Loyer mensuel et dépôt de garantie doivent être positifs.');
        return;
      }
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
        canal_2fa: 'mail',
      };

      const response = await UserService.createUser(userData);

      if (!response.success) {
        const errorMsg = response.errors?.[0]?.message || response.message || 'Erreur lors de la création';
        setErrorFeedback(errorMsg);
        addNotification({
          titre: 'Erreur de création utilisateur',
          message: errorMsg,
          type: 'alerte',
        });
        return;
      }

      if (role === 'tenant') {
        const createdUserId = await resolveCreatedTenantUserId(userData.email);
        if (!createdUserId) {
          setErrorFeedback('Compte locataire créé, mais impossible de retrouver son identifiant pour créer le dossier locataire.');
          return;
        }

        const locatairePayload: CreateLocatairePayload = {
          user_id: createdUserId,
          proprietaire_id: proprietaireId,
          date_naissance: dateNaissance || undefined,
          profession: profession || undefined,
          garant_nom: garantNom || undefined,
          garant_contact: garantContact || undefined,
        };

        const locataireResponse = await LocationsService.createLocataire(locatairePayload);
        if (!locataireResponse.success || !locataireResponse.data?.id) {
          const locataireErr = locataireResponse.errors?.[0]?.message || locataireResponse.message || 'Échec création dossier locataire';
          setErrorFeedback(`Compte créé, mais dossier locataire non créé: ${locataireErr}`);
          return;
        }

        const bailPayload: CreateBailPayload = {
          locataire: locataireResponse.data.id,
          bien: bienId,
          date_entree: dateEntree,
          date_sortie: dateSortie,
          loyer_mensuel: Number(loyerMensuel),
          depot_garantie: Number(depotGarantie),
          date_revision: dateRevision || undefined,
        };

        const bailResponse = await LocationsService.createBail(bailPayload);
        if (!bailResponse.success) {
          const bailErr = bailResponse.errors?.[0]?.message || bailResponse.message || 'Échec création bail';
          setErrorFeedback(`Compte + dossier locataire créés, mais bail non créé: ${bailErr}`);
          return;
        }
      }

      setUserFeedback('Compte créé avec succès. Redirection en cours...');
      addNotification({
        titre: 'Utilisateur créé',
        message: `Nouveau compte (${role}) : ${firstName} ${lastName}.`,
        type: 'info',
      });

      setTimeout(() => {
        router.push('/admin/users');
      }, 700);
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorFeedback('Erreur de connexion au serveur.');
      addNotification({
        titre: 'Erreur serveur',
        message: 'Impossible de créer le compte actuellement.',
        type: 'alerte',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Créer un utilisateur</h1>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour à la liste
        </Link>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Définir un mot de passe (min. 8 caractères)"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                disabled={isSubmitting}
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Générer
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Afficher le mot de passe
            </label>
            <p className="text-xs font-normal text-zinc-500">
              Tips: cliquez sur "Générer" pour créer un mot de passe sécurisé automatiquement.
            </p>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Rôle
            <select
              value={role}
              onChange={(e) => {
                const nextRole = e.target.value as UserRole;
                setRole(nextRole);
                if (nextRole !== 'tenant') {
                  setProprietaireId('');
                  setBienId('');
                  setDateNaissance('');
                  setProfession('');
                  setGarantNom('');
                  setGarantContact('');
                  setDateEntree('');
                  setDateSortie('');
                  setLoyerMensuel('');
                  setDepotGarantie('');
                  setDateRevision('');
                }
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={isSubmitting}
            >
              <option value="tenant">Locataire</option>
              <option value="owner">Propriétaire</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {role === 'tenant' && (
            <>
              <div className="sm:col-span-2 mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-900">Configuration locataire (admin)</p>
                <p className="text-xs text-zinc-600">Le compte locataire sera créé, puis son dossier locataire et son bail.</p>
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
                Propriétaire associé *
                <select
                  value={proprietaireId}
                  onChange={(e) => {
                    setProprietaireId(e.target.value);
                    setBienId('');
                  }}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting || isLoadingOwners}
                  required={role === 'tenant'}
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
                Bien associé *
                <select
                  value={bienId}
                  onChange={(e) => setBienId(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting || isLoadingProperties || !proprietaireId}
                  required={role === 'tenant'}
                >
                  <option value="">{proprietaireId ? 'Sélectionner un bien' : 'Choisir d abord un propriétaire'}</option>
                  {properties.map((bien) => (
                    <option key={bien.id} value={bien.id}>
                      {`${bien.adresse || bien.adresse_complete || `Bien ${String(bien.id).slice(0, 8)}`} (${Number(bien.loyer_mensuel || 0).toLocaleString('fr-FR')} FCFA)`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Date de naissance
                <input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Profession
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Ingénieur"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Nom du garant
                <input
                  type="text"
                  value={garantNom}
                  onChange={(e) => setGarantNom(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Contact du garant
                <input
                  type="text"
                  value={garantContact}
                  onChange={(e) => setGarantContact(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Date d entrée *
                <input
                  type="date"
                  value={dateEntree}
                  onChange={(e) => setDateEntree(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                  required={role === 'tenant'}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Date de sortie *
                <input
                  type="date"
                  value={dateSortie}
                  onChange={(e) => setDateSortie(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                  required={role === 'tenant'}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Loyer mensuel (FCFA) *
                <input
                  type="number"
                  min={0}
                  value={loyerMensuel}
                  onChange={(e) => setLoyerMensuel(e.target.value)}
                  placeholder={selectedProperty?.loyer_mensuel ? String(selectedProperty.loyer_mensuel) : '120000'}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                  required={role === 'tenant'}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Dépôt de garantie (FCFA) *
                <input
                  type="number"
                  min={0}
                  value={depotGarantie}
                  onChange={(e) => setDepotGarantie(e.target.value)}
                  placeholder="120000"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                  required={role === 'tenant'}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
                Date de révision (optionnel)
                <input
                  type="date"
                  value={dateRevision}
                  onChange={(e) => setDateRevision(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  disabled={isSubmitting}
                />
              </label>
            </>
          )}

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
    </>
  );
}
