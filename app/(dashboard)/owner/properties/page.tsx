"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, Clock3, Loader2, PlusCircle } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';
import { useReports } from '@/components/reports/ReportProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { Bien } from '@/types/api';

type RentStatus = 'paid' | 'late' | 'pending';

type OwnerProperty = {
  id: string;
  title: string;
  address: string;
  rentAmount: number;
  status: 'vacant' | 'rented' | 'maintenance';
  tenantName: string | null;
  rentStatus: RentStatus;
  image?: string;
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const rentStatusLabel: Record<RentStatus, string> = { paid: 'Payé', late: 'En retard', pending: 'En attente' };
const rentStatusClass: Record<RentStatus, string> = { paid: 'text-green-700', late: 'text-orange-700', pending: 'text-zinc-600' };

// Mapping du statut backend vers UI
const mapStatutToUI = (statut: Bien['statut']): OwnerProperty['status'] => {
  switch (statut) {
    case 'loue': return 'rented';
    case 'maintenance': return 'maintenance';
    case 'reservation': return 'rented';
    case 'vacant':
    default: return 'vacant';
  }
};

// Mapping Bien backend vers OwnerProperty UI
const mapBienToOwnerProperty = (bien: Record<string, unknown>): OwnerProperty => ({
  id: String(bien.id),
  title:
    typeof bien.description === 'string' && bien.description.trim()
      ? `Bien - ${bien.description.slice(0, 40)}`
      : `Bien ${String(bien.id).slice(0, 8)}`,
  address:
    (typeof bien.adresse === 'string' && bien.adresse) ||
    (typeof bien.adresse_complete === 'string' && bien.adresse_complete) ||
    'Adresse non disponible',
  rentAmount: Number(bien.loyer_hc ?? bien.loyer_mensuel ?? 0),
  status: mapStatutToUI((bien.statut ?? 'vacant') as Bien['statut']),
  tenantName: null, // TODO: Charger via LocationsService si nécessaire
  rentStatus: bien.statut === 'loue' ? 'paid' : 'pending',
  image:
    (typeof bien.photo_principale === 'string' && bien.photo_principale) ||
    (Array.isArray(bien.photos)
      ? ((bien.photos[0] as { fichier?: string } | undefined)?.fichier ?? undefined)
      : undefined) ||
    (Array.isArray(bien.images) ? (bien.images[0] as string | undefined) : undefined),
});

export default function OwnerPropertiesPage() {
  const { addNotification } = useNotifications();
  const { startManualPayment } = usePayments();
  const { exportTableReport } = useReports();

  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les biens depuis le backend
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await PatrimoineService.getBiens();
      if (response.success && response.data) {
        const mapped = response.data.map((item) => mapBienToOwnerProperty(item as unknown as Record<string, unknown>));
        setProperties(mapped);
      } else {
        setError(response.message || 'Erreur lors du chargement des biens');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des biens:', err);
      setError('Erreur technique lors du chargement des biens');
    } finally {
      setIsLoading(false);
    }
  };

  const lateProperties = properties.filter((p) => p.status === 'rented' && p.rentStatus === 'late');

  const registerPayment = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property || property.status !== 'rented' || property.rentStatus === 'paid') return;

    setProperties((current) =>
      current.map((p) => (p.id === propertyId ? { ...p, rentStatus: 'paid' } : p)),
    );

    startManualPayment({
      tenantName: property.tenantName ?? 'Locataire non renseigné',
      propertyTitle: property.title,
      month: 'mars 2026',
      amount: property.rentAmount,
    });

    addNotification({
      type: 'paiement',
      titre: `Paiement enregistré: ${property.title}`,
      message: `Un paiement de ${currencyFormatter.format(property.rentAmount)} a été enregistré.`,
    });
  };

  const exportPropertiesTable = () => {
    exportTableReport({
      title: 'Tableau biens propriétaire',
      role: 'owner',
      generatedBy: 'owner_dashboard',
      headers: ['Bien', 'Adresse', 'Locataire', 'Statut loyer'],
      rows: properties.map((p) => [p.title, p.address, p.tenantName ?? 'Aucun', p.rentStatus]),
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Building2 className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Mes biens</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/owner/properties/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Ajouter un bien
          </Link>
          <button type="button" onClick={exportPropertiesTable} className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
            Exporter PDF
          </button>
        </div>
      </div>

      {lateProperties.length > 0 && (
        <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-800">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Paiements en retard
          </p>
          <ul className="mt-2 space-y-1 text-sm text-orange-700">
            {lateProperties.map((p) => <li key={p.id}>- {p.title}</li>)}
          </ul>
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Liste des biens ({properties.length})</h2>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement des biens...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadProperties}
              className="mt-2 inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
            >
              Réessayer
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-zinc-500">Aucun bien trouvé</p>
            <p className="mt-1 text-sm text-zinc-400">Ajoutez votre premier bien ci-dessous</p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
            <article key={property.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                    {property.image ? (
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-zinc-500">
                        Pas d&apos;image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{property.title}</p>
                  <p className="text-xs text-zinc-500">{property.address}</p>
                  <p className="mt-1 text-sm text-zinc-700">
                    Locataire: <span>{property.tenantName ?? 'Aucun (bien non lou&eacute;)'}</span>
                  </p>
                  <p className="text-sm text-zinc-700">
                    Loyer:{' '}
                    <strong className={rentStatusClass[property.rentStatus]}>
                      {rentStatusLabel[property.rentStatus]}
                    </strong>
                  </p>
                </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/owner/properties/${property.id}`}
                    className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Voir détail
                  </Link>
                  <button
                    type="button"
                    onClick={() => registerPayment(property.id)}
                    disabled={property.status !== 'rented' || property.rentStatus === 'paid'}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Enregistrer paiement
                  </button>
                </div>
              </div>
            </article>
          ))}
          </div>
        )}
      </section>

    </>
  );
}
