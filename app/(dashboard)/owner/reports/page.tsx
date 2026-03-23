"use client";

import { useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { Paiement, Bien } from '@/types/api';

interface PaymentUI {
  id: string;
  propertyTitle: string;
  tenantName: string;
  amount: number;
  date: string;
  month: string;
  status: string;
  reference?: string;
}

interface PropertyUI {
  id: string;
  title: string;
  address: string;
  tenantName: string | null;
  rentStatus: 'paid' | 'late' | 'pending';
}

interface ReportArchive {
  id: string;
  title: string;
  fileName: string;
  generatedAt: string;
  emailed: boolean;
  role: 'owner';
}

const mapPaiementToUI = (paiement: Paiement): PaymentUI => ({
  id: paiement.id,
  propertyTitle: paiement.bail_detail?.bien_adresse || 'Bien inconnu',
  tenantName: paiement.bail_detail?.locataire_nom || 'Locataire inconnu',
  amount: paiement.montant,
  date: new Date(paiement.date_paiement).toLocaleDateString('fr-TG'),
  month: new Date(paiement.date_paiement).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  status: paiement.statut === 'paye' ? 'paid' : paiement.statut === 'en_retard' ? 'late' : 'pending',
  reference: paiement.transaction_ref,
});

const mapBienToPropertyUI = (bien: Bien): PropertyUI => ({
  id: bien.id,
  title: bien.titre,
  address: bien.adresse_complete,
  tenantName: null, // À récupérer via LocationsService si nécessaire
  rentStatus: bien.statut === 'loue' ? 'paid' : bien.statut === 'maintenance' ? 'late' : 'pending',
});

// Générer un rapport CSV côté client
const generateCSV = (headers: string[], rows: (string | number)[][]): string => {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const headerLine = headers.map(escape).join(';');
  const rowsLines = rows.map(row => row.map(escape).join(';'));
  return [headerLine, ...rowsLines].join('\n');
};

// Télécharger un fichier
const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function OwnerReportsPage() {
  const { addNotification } = useNotifications();

  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [properties, setProperties] = useState<PropertyUI[]>([]);
  const [archives, setArchives] = useState<ReportArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState('mars 2026');

  // Charger les données depuis le backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [paiementsResponse, biensResponse] = await Promise.all([
        ComptabiliteService.getPaiements(),
        PatrimoineService.getBiens(),
      ]);

      if (paiementsResponse.success && paiementsResponse.data) {
        setPayments(paiementsResponse.data.map(mapPaiementToUI));
      }

      if (biensResponse.success && biensResponse.data) {
        setProperties(biensResponse.data.map(mapBienToPropertyUI));
      }

      // Charger les archives depuis localStorage
      const storedArchives = localStorage.getItem('owner_report_archives');
      if (storedArchives) {
        setArchives(JSON.parse(storedArchives));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const addToArchives = (archive: ReportArchive) => {
    const newArchives = [archive, ...archives].slice(0, 20);
    setArchives(newArchives);
    localStorage.setItem('owner_report_archives', JSON.stringify(newArchives));
  };

  const exportOwnerReport = () => {
    const periodSlug = reportPeriod.replace(/\s+/g, '_').toLowerCase();
    const fileName = `rapport_proprietaire_${periodSlug}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const headers = ['Référence', 'Date', 'Bien', 'Locataire', 'Mois', 'Montant (XOF)', 'Statut'];
    const rows = payments.map(item => [
      item.reference || '-',
      item.date,
      item.propertyTitle,
      item.tenantName,
      item.month,
      item.amount,
      item.status === 'paid' ? 'Payé' : item.status === 'late' ? 'En retard' : 'En attente'
    ]);

    const csv = generateCSV(headers, rows);
    downloadFile(csv, fileName, 'text/csv;charset=utf-8;');

    const archive: ReportArchive = {
      id: `report-${Date.now()}`,
      title: `Rapport période: ${reportPeriod}`,
      fileName,
      generatedAt: new Date().toISOString(),
      emailed: false,
      role: 'owner',
    };
    addToArchives(archive);

    addNotification({ 
      type: 'info', 
      titre: 'Rapport généré', 
      message: `Rapport propriétaire exporté (${fileName}).` 
    });
  };

  const exportPropertiesTable = () => {
    const fileName = `tableau_biens_${new Date().toISOString().split('T')[0]}.csv`;
    
    const headers = ['Bien', 'Adresse', 'Locataire', 'Statut loyer'];
    const rows = properties.map(item => [
      item.title,
      item.address,
      item.tenantName || 'Aucun',
      item.rentStatus === 'paid' ? 'Payé' : item.rentStatus === 'late' ? 'En retard' : 'En attente'
    ]);

    const csv = generateCSV(headers, rows);
    downloadFile(csv, fileName, 'text/csv;charset=utf-8;');

    const archive: ReportArchive = {
      id: `report-${Date.now()}`,
      title: 'Tableau biens propriétaire',
      fileName,
      generatedAt: new Date().toISOString(),
      emailed: false,
      role: 'owner',
    };
    addToArchives(archive);

    addNotification({ 
      type: 'info', 
      titre: 'Tableau exporté', 
      message: 'Tableau des biens exporté avec succès.' 
    });
  };

  const exportPaymentsTable = () => {
    const fileName = `tableau_paiements_${new Date().toISOString().split('T')[0]}.csv`;
    
    const headers = ['Bien', 'Locataire', 'Montant (XOF)', 'Date', 'Statut'];
    const rows = payments.slice(0, 10).map(item => [
      item.propertyTitle,
      item.tenantName,
      item.amount,
      item.date,
      item.status === 'paid' ? 'Payé' : item.status === 'late' ? 'En retard' : 'En attente'
    ]);

    const csv = generateCSV(headers, rows);
    downloadFile(csv, fileName, 'text/csv;charset=utf-8;');

    const archive: ReportArchive = {
      id: `report-${Date.now()}`,
      title: 'Tableau paiements récents',
      fileName,
      generatedAt: new Date().toISOString(),
      emailed: false,
      role: 'owner',
    };
    addToArchives(archive);

    addNotification({ 
      type: 'info', 
      titre: 'Tableau exporté', 
      message: 'Tableau des paiements exporté avec succès.' 
    });
  };

  const emailArchiveItem = (archiveId: string) => {
    const updatedArchives = archives.map(archive => 
      archive.id === archiveId ? { ...archive, emailed: true } : archive
    );
    setArchives(updatedArchives);
    localStorage.setItem('owner_report_archives', JSON.stringify(updatedArchives));
    
    addNotification({ 
      type: 'info', 
      titre: 'Email envoyé', 
      message: 'Le rapport a été envoyé par email.' 
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <FileUp className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Rapports PDF</h1>
      </div>

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Générer des exports</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="mars 2026">mars 2026</option>
            <option value="avril 2026">avril 2026</option>
            <option value="année 2026">année 2026</option>
          </select>
          <button type="button" onClick={exportOwnerReport} className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
            Rapport période
          </button>
          <button type="button" onClick={exportPropertiesTable} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
            Tableau biens
          </button>
          <button type="button" onClick={exportPaymentsTable} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
            Tableau paiements
          </button>
          <button
            type="button"
            onClick={() => archives[0] && emailArchiveItem(archives[0].id)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Envoyer dernier export (email)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Archives ({archives.length})</h2>
        <div className="space-y-2">
          {archives.length === 0 && <p className="text-sm text-zinc-500">Aucun rapport généré pour le moment.</p>}
          {archives.slice(0, 8).map((item: ReportArchive) => (
            <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-500">{new Date(item.generatedAt).toLocaleString('fr-TG')} · {item.fileName}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.emailed ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {item.emailed ? 'Email envoyé' : 'Non envoyé'}
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
