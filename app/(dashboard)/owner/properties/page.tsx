"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Building2, Clock3, FileUp, PlusCircle } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';
import { useReports } from '@/components/reports/ReportProvider';

type RentStatus = 'paid' | 'late' | 'pending';

type OwnerProperty = {
  id: string;
  title: string;
  address: string;
  rentAmount: number;
  status: 'vacant' | 'rented' | 'maintenance';
  tenantName: string | null;
  rentStatus: RentStatus;
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const initialProperties: OwnerProperty[] = [
  { id: 'prop-1', title: 'Appartement meublé à Bè', address: 'Avenue de la Libération, Lomé', rentAmount: 180000, status: 'rented', tenantName: 'Kossi Mensah', rentStatus: 'paid' },
  { id: 'prop-2', title: 'Studio moderne proche université', address: 'Quartier Kpota, Kara', rentAmount: 75000, status: 'rented', tenantName: 'Afi Koutou', rentStatus: 'late' },
  { id: 'prop-4', title: 'T2 proche du marché', address: 'Quartier Nyivé, Kpalimé', rentAmount: 110000, status: 'vacant', tenantName: null, rentStatus: 'pending' },
  { id: 'prop-6', title: 'Immeuble en cours de rénovation', address: 'Route nationale N°1, Tsévié', rentAmount: 160000, status: 'maintenance', tenantName: null, rentStatus: 'pending' },
];

const rentStatusLabel: Record<RentStatus, string> = { paid: 'Payé', late: 'En retard', pending: 'En attente' };
const rentStatusClass: Record<RentStatus, string> = { paid: 'text-green-700', late: 'text-orange-700', pending: 'text-zinc-600' };

export default function OwnerPropertiesPage() {
  const { addNotification } = useNotifications();
  const { startManualPayment } = usePayments();
  const { exportTableReport } = useReports();

  const [properties, setProperties] = useState<OwnerProperty[]>(initialProperties);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newRent, setNewRent] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [formFeedback, setFormFeedback] = useState('');

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
      category: 'payment',
      title: `Paiement enregistré: ${property.title} (${currencyFormatter.format(property.rentAmount)}).`,
    });
  };

  const handleAddProperty = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedRent = Number(newRent);
    if (!newTitle.trim() || !newAddress.trim() || !parsedRent) return;

    const newProperty: OwnerProperty = {
      id: `prop-${Date.now()}`,
      title: newTitle.trim(),
      address: newAddress.trim(),
      rentAmount: parsedRent,
      status: 'vacant',
      tenantName: null,
      rentStatus: 'pending',
    };

    setProperties((current) => [newProperty, ...current]);
    setFormFeedback('Bien soumis à l\'admin avec succès.');
    setNewTitle(''); setNewAddress(''); setNewRent(''); setPhotoName('');
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
        <button type="button" onClick={exportPropertiesTable} className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
          Exporter PDF
        </button>
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
        <div className="space-y-3">
          {properties.map((property) => (
            <article key={property.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{property.title}</p>
                  <p className="text-xs text-zinc-500">{property.address}</p>
                  <p className="mt-1 text-sm text-zinc-700">
                    Locataire: <span>{property.tenantName ?? 'Aucun (bien non loué)'}</span>
                  </p>
                  <p className="text-sm text-zinc-700">
                    Loyer:{' '}
                    <strong className={rentStatusClass[property.rentStatus]}>
                      {rentStatusLabel[property.rentStatus]}
                    </strong>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/properties/${property.id}?role=owner`}
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
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-zinc-900">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-base font-semibold">Ajouter un bien (MVP)</h2>
        </div>
        <form onSubmit={handleAddProperty} className="space-y-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Titre
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Villa 4 pièces à Lomé" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Adresse
            <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Quartier, ville" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Loyer mensuel (FCFA)
            <input type="number" min={0} value={newRent} onChange={(e) => setNewRent(e.target.value)} placeholder="120000" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Photo (simulée)
            <input type="file" accept="image/*" onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? '')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900" />
          </label>
          {photoName && (
            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              {photoName}
            </p>
          )}
          <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
            Soumettre à l&apos;admin
          </button>
          {formFeedback && <p className="text-sm font-medium text-green-700">{formFeedback}</p>}
        </form>
      </section>
    </>
  );
}
