"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Home,
  Info,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react';
import { normalizeMediaUrl } from '@/lib/utils';
import { LocationsService } from '@/lib/locations-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { UserService } from '@/lib/user-service';
import { Bail, Bien, Locataire } from '@/types/api';

type UserRole = 'tenant' | 'owner' | 'admin';

type ManagedUserDetail = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  backendRole: 'locataire' | 'proprietaire' | 'superadmin';
  roleLabel: string;
  isActive: boolean;
  createdAt: string;
  phoneNumber: string | null;
  secondFactorChannel: 'mail' | 'sms';
  unreadNotifications: number;
};

type TenantRental = {
  bail: Bail;
  bien: Bien | null;
};

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    tenant: 'Locataire',
    owner: 'Propriétaire',
    admin: 'Administrateur',
  };

  return labels[role];
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return dateFormatter.format(parsed);
}

function getStatusBadge(statut: string): string {
  if (statut === 'loue' || statut === 'actif') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }

  if (statut === 'vacant' || statut === 'termine') {
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }

  if (statut === 'maintenance' || statut === 'suspendu') {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }

  return 'bg-zinc-50 text-zinc-700 ring-zinc-200';
}

function getStatusLabel(statut: string): string {
  const mapping: Record<string, string> = {
    loue: 'Loué',
    vacant: 'Vacant',
    maintenance: 'Maintenance',
    reservation: 'Réservation',
    actif: 'Actif',
    termine: 'Terminé',
    suspendu: 'Suspendu',
  };

  return mapping[statut] || statut;
}

function formatText(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const content = String(value).trim();
  return content.length > 0 ? content : '-';
}

function formatBool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return value ? 'Oui' : 'Non';
}

function extractPropertyImages(property: Bien): string[] {
  const rawProperty = property as unknown as Record<string, unknown>;

  const normalizeCandidate = (value: unknown): string | null => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }

    return normalizeMediaUrl(trimmed.replaceAll('\\', '/'));
  };

  const fromMainPhoto = normalizeCandidate(rawProperty.photo_principale);

  const fromImages = Array.isArray(property.images)
    ? property.images
        .map((img) => normalizeCandidate(img))
        .filter((img): img is string => Boolean(img))
    : [];

  const fromPhotos = Array.isArray(property.photos)
    ? property.photos
        .map((photo) => normalizeCandidate(photo?.fichier))
        .filter((img): img is string => Boolean(img))
    : [];

  const unique = [fromMainPhoto, ...fromImages, ...fromPhotos].filter((img): img is string => Boolean(img));
  return Array.from(new Set(unique));
}

function getAmenities(property: Bien): string[] {
  const amenities: Array<[boolean, string]> = [
    [property.meuble, 'Meublé'],
    [property.parking, 'Parking'],
    [property.ascenseur, 'Ascenseur'],
    [property.balcon, 'Balcon'],
    [property.jardin, 'Jardin'],
    [property.piscine, 'Piscine'],
    [property.climatisation, 'Climatisation'],
    [property.chauffage, 'Chauffage'],
    [property.securite, 'Sécurité'],
  ];

  return amenities.filter((entry) => entry[0]).map((entry) => entry[1]);
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = typeof params?.id === 'string' ? params.id : '';

  const [user, setUser] = useState<ManagedUserDetail | null>(null);
  const [ownerProperties, setOwnerProperties] = useState<Bien[]>([]);
  const [tenantProfile, setTenantProfile] = useState<Locataire | null>(null);
  const [tenantRentals, setTenantRentals] = useState<TenantRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const usersResponse = await UserService.getAllUsers();
        if (!usersResponse.success || !usersResponse.data) {
          setError(usersResponse.message || 'Impossible de récupérer cet utilisateur.');
          return;
        }

        const rawUser = usersResponse.data.find((entry) => entry.id === userId);
        if (!rawUser) {
          setError('Utilisateur introuvable.');
          return;
        }

        const mappedRole = UserService.mapBackendRoleToFrontend(rawUser.role);
        const mappedUser: ManagedUserDetail = {
          id: rawUser.id,
          fullName: rawUser.full_name,
          firstName: rawUser.first_name,
          lastName: rawUser.last_name,
          email: rawUser.email,
          role: mappedRole,
          backendRole: rawUser.role,
          roleLabel: getRoleLabel(mappedRole),
          isActive: rawUser.is_active ?? true,
          createdAt: rawUser.created_at,
          phoneNumber: rawUser.phone_number,
          secondFactorChannel: rawUser.canal_2fa,
          unreadNotifications: rawUser.notifications_non_lues,
        };

        setUser(mappedUser);

        if (mappedRole === 'owner') {
          const propertiesResponse = await PatrimoineService.getBiens({ proprietaire: mappedUser.id });
          if (propertiesResponse.success && propertiesResponse.data) {
            setOwnerProperties(propertiesResponse.data);
          } else {
            setError(propertiesResponse.message || 'Impossible de charger les biens du propriétaire.');
          }
        }

        if (mappedRole === 'tenant') {
          const tenantProfileResponse = await LocationsService.getLocataires();
          if (!tenantProfileResponse.success || !tenantProfileResponse.data) {
            setError(tenantProfileResponse.message || 'Impossible de charger le dossier locataire.');
            return;
          }

          const currentTenantProfile = tenantProfileResponse.data.find((entry) => entry.user === mappedUser.id) || null;
          setTenantProfile(currentTenantProfile);

          if (!currentTenantProfile) {
            return;
          }

          const [bauxResponse, biensResponse] = await Promise.all([
            LocationsService.getBaux(),
            PatrimoineService.getBiens(),
          ]);

          if (!bauxResponse.success || !bauxResponse.data) {
            setError(bauxResponse.message || 'Impossible de charger les locations.');
            return;
          }

          const byId = new Map<string, Bien>();
          if (biensResponse.success && biensResponse.data) {
            biensResponse.data.forEach((item) => byId.set(item.id, item));
          }

          const rentals = bauxResponse.data
            .filter((bail) => bail.locataire === currentTenantProfile.id)
            .map((bail) => ({
              bail,
              bien: byId.get(bail.bien) || null,
            }));

          setTenantRentals(rentals);
        }
      } catch (err) {
        console.error('Erreur chargement détail utilisateur:', err);
        setError('Erreur de connexion serveur.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [userId]);

  const initials = useMemo(() => {
    if (!user) {
      return 'NA';
    }

    const letters = `${user.firstName} ${user.lastName}`
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

    return letters || user.email.slice(0, 2).toUpperCase();
  }, [user]);

  const ownerStats = useMemo(() => {
    const total = ownerProperties.length;
    const rented = ownerProperties.filter((item) => item.statut === 'loue').length;
    const revenue = ownerProperties.reduce((sum, item) => sum + Number(item.loyer_mensuel || 0), 0);

    return { total, rented, revenue };
  }, [ownerProperties]);

  const tenantStats = useMemo(() => {
    const total = tenantRentals.length;
    const actifs = tenantRentals.filter((item) => item.bail.statut === 'actif').length;
    const mensualite = tenantRentals.reduce((sum, item) => sum + Number(item.bail.loyer_mensuel || 0), 0);

    return { total, actifs, mensualite };
  }, [tenantRentals]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-zinc-500" aria-hidden="true" />
        <p className="mt-3 text-sm text-zinc-600">Chargement du profil utilisateur...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <section className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour aux utilisateurs
        </Link>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">{error || 'Utilisateur introuvable'}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour aux utilisateurs
        </Link>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
          {user.isActive ? 'Compte actif' : 'Compte inactif'}
        </span>
      </div>

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{user.fullName || `${user.firstName} ${user.lastName}`.trim()}</h1>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-zinc-600">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {user.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {user.roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  2FA: {user.secondFactorChannel === 'sms' ? 'SMS' : 'Email'}
                </span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 sm:min-w-[290px]">
            <div>
              <dt className="font-medium text-zinc-500">Créé le</dt>
              <dd className="mt-0.5 text-zinc-900">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Notifications non lues</dt>
              <dd className="mt-0.5 text-zinc-900">{user.unreadNotifications}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-medium text-zinc-500">Téléphone</dt>
              <dd className="mt-0.5 text-zinc-900">{user.phoneNumber || '-'}</dd>
            </div>
          </dl>
        </div>
      </article>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-zinc-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-zinc-900">Informations complètes du compte</h2>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">ID utilisateur</dt>
            <dd className="mt-1 break-all font-medium text-zinc-900">{user.id}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Prénom</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatText(user.firstName)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Nom</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatText(user.lastName)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Email</dt>
            <dd className="mt-1 break-all font-medium text-zinc-900">{formatText(user.email)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Rôle (frontend)</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatText(user.roleLabel)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Rôle (backend)</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatText(user.backendRole)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Statut du compte</dt>
            <dd className="mt-1 font-medium text-zinc-900">{user.isActive ? 'Actif' : 'Inactif'}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Canal 2FA</dt>
            <dd className="mt-1 font-medium text-zinc-900">{user.secondFactorChannel === 'sms' ? 'SMS' : 'Email'}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Téléphone</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatText(user.phoneNumber)}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Date de création</dt>
            <dd className="mt-1 font-medium text-zinc-900">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      {user.role === 'owner' && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Biens</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{ownerStats.total}</p>
            </article>
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Biens loués</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{ownerStats.rented}</p>
            </article>
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Loyer mensuel cumulé</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{currencyFormatter.format(ownerStats.revenue)}</p>
            </article>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-zinc-900">Biens du propriétaire</h2>
            </div>

            {ownerProperties.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-5 text-center text-sm text-zinc-500">
                Aucun bien enregistré pour ce propriétaire.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ownerProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/admin/properties/${property.id}`}
                    className="group overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white"
                  >
                    <div className="relative h-44 w-full bg-zinc-100">
                      <img
                        src={extractPropertyImages(property)[0] || '/window.svg'}
                        alt={property.titre || `Bien ${property.id}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src = '/window.svg';
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-zinc-700">
                        {property.titre || property.adresse || property.adresse_complete || `Bien ${property.id}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {user.role === 'tenant' && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Locations</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{tenantStats.total}</p>
            </article>
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Baux actifs</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{tenantStats.actifs}</p>
            </article>
            <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Loyer mensuel total</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{currencyFormatter.format(tenantStats.mensualite)}</p>
            </article>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-zinc-900">Dossier locataire détaillé</h2>
            </div>

            {!tenantProfile ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-5 text-center text-sm text-zinc-500">
                Aucun dossier locataire lié à ce compte.
              </p>
            ) : (
              <dl className="mb-5 grid grid-cols-1 gap-2 text-xs text-zinc-700 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">ID dossier</dt><dd className="mt-0.5 break-all text-zinc-900">{tenantProfile.id}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Téléphone</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.telephone)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Date de naissance</dt><dd className="mt-0.5 text-zinc-900">{formatDate(tenantProfile.date_naissance)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Lieu de naissance</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.lieu_naissance)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Nationalité</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.nationalite)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Pièce d'identité</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.piece_identite)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Numéro de pièce</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.numero_piece)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Expiration pièce</dt><dd className="mt-0.5 text-zinc-900">{formatDate(tenantProfile.date_expiration_piece)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Revenu mensuel</dt><dd className="mt-0.5 text-zinc-900">{currencyFormatter.format(Number(tenantProfile.revenu_mensuel || 0))}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Profession</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.profession)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Employeur</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.employeur)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Téléphone employeur</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.telephone_employeur)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 lg:col-span-2"><dt className="font-medium text-zinc-500">Références personnelles</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.references_personnelles)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Garant</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.garant_nom)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Tél. garant</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.garant_telephone)}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Revenu garant</dt><dd className="mt-0.5 text-zinc-900">{tenantProfile.garant_revenu ? currencyFormatter.format(Number(tenantProfile.garant_revenu || 0)) : '-'}</dd></div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="font-medium text-zinc-500">Profession garant</dt><dd className="mt-0.5 text-zinc-900">{formatText(tenantProfile.garant_profession)}</dd></div>
              </dl>
            )}

            <div className="mb-4 flex items-center gap-2">
              <Home className="h-4 w-4 text-zinc-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-zinc-900">Ce que ce locataire a loué</h2>
            </div>

            {!tenantProfile ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-5 text-center text-sm text-zinc-500">
                Aucun dossier locataire lié à ce compte.
              </p>
            ) : tenantRentals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-5 text-center text-sm text-zinc-500">
                Aucun bail trouvé pour ce locataire.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tenantRentals.map(({ bail, bien }) => (
                  <Link
                    key={bail.id}
                    href={`/admin/properties/${bien?.id || bail.bien}`}
                    className="group overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white"
                  >
                    <div className="relative h-44 w-full bg-zinc-100">
                      <img
                        src={(bien && extractPropertyImages(bien)[0]) || '/window.svg'}
                        alt={bien?.titre || `Bien ${bail.bien}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src = '/window.svg';
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-zinc-700">
                        {bien?.titre || bien?.adresse || bien?.adresse_complete || `Bien ${bail.bien}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {user.role === 'admin' && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-700" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-900">Informations administrateur</h2>
          </div>
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Ce compte dispose des permissions super admin. Vous pouvez consulter ses informations de sécurité et d accès dans ce profil.
          </p>
        </section>
      )}
    </section>
  );
}
