"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, FileText, Mail, Home, Calendar, Wallet, FileSignature, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { AuthService } from '@/lib/auth-service';
import { LocationsService } from '@/lib/locations-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { PaiementEnLigneService } from '@/lib/paiement-en-ligne-service';
import { Bail, Bien, TransactionPaiement } from '@/types/api';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const formatDateShort = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDateLong = (date: Date) =>
  date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

type NextDue = {
  monthLabel: string;
  dueDateLabel: string;
  amount: number;
};

const toMonthKey = (value: Date | string): string => {
  const source = typeof value === 'string' ? new Date(value) : value;
  const y = source.getFullYear();
  const m = String(source.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const computeNextDue = (bail: Bail, transactions: TransactionPaiement[]): NextDue | null => {
  const paidMonths = new Set(
    transactions
      .filter((tx) => tx.statut === 'valide')
      .map((tx) => toMonthKey(tx.mois_concerne))
  );

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = new Date(bail.date_debut);
  const endDate = new Date(bail.date_fin);

  const leaseStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const leaseEndMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const scanStart = currentMonth > leaseStartMonth ? currentMonth : leaseStartMonth;
  const maxIterations = 36;

  let cursor = new Date(scanStart);
  for (let i = 0; i < maxIterations && cursor <= leaseEndMonth; i += 1) {
    const key = toMonthKey(cursor);
    if (!paidMonths.has(key)) {
      const monthLabel = cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const dueDate = new Date(cursor.getFullYear(), cursor.getMonth(), 5);

      return {
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        dueDateLabel: formatDateLong(dueDate),
        amount: bail.loyer_mensuel + bail.charges_mensuelles,
      };
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return null;
};

const quickLinks = [
  { 
    href: '/tenant/payment', 
    title: 'Payer mon loyer', 
    description: 'Effectuer un paiement sécurisé',
    icon: Wallet, 
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-100'
  },
  { 
    href: '/tenant/history', 
    title: 'Historique', 
    description: 'Voir tous mes paiements',
    icon: FileText, 
    color: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-indigo-100'
  },
  { 
    href: '/tenant/notifications', 
    title: 'Notifications', 
    description: 'Mes alertes et messages',
    icon: Bell, 
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-100'
  },
  { 
    href: '/tenant/contact', 
    title: 'Support', 
    description: 'Contacter la gestion',
    icon: Mail, 
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-100'
  },
];

export default function TenantOverviewPage() {
  const { unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bail, setBail] = useState<Bail | null>(null);
  const [bien, setBien] = useState<Bien | null>(null);
  const [transactions, setTransactions] = useState<TransactionPaiement[]>([]);
  const [tenantFirstName, setTenantFirstName] = useState('Locataire');

  useEffect(() => {
    const user = AuthService.getCurrentUserFromStorage();
    if (user?.first_name?.trim()) {
      setTenantFirstName(user.first_name.trim());
    }
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [bailResponse, transactionsResponse] = await Promise.all([
        LocationsService.getMonBail(),
        PaiementEnLigneService.getHistoriqueTransactions(),
      ]);

      const nextBail = bailResponse.success ? bailResponse.data : null;
      const nextTransactions = transactionsResponse.success && transactionsResponse.data
        ? transactionsResponse.data
        : [];

      setBail(nextBail);
      setTransactions(nextTransactions);

      if (nextBail?.bien) {
        const bienResponse = await PatrimoineService.getBien(nextBail.bien);
        if (bienResponse.success && bienResponse.data) {
          setBien(bienResponse.data);
        } else {
          setBien(null);
        }
      } else {
        setBien(null);
      }
    } catch (loadError) {
      setError('Impossible de charger votre tableau de bord locataire.');
      setBail(null);
      setBien(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const propertyTitle = useMemo(() => {
    if (bien?.titre?.trim()) {
      return bien.titre;
    }
    if (bien?.adresse_complete?.trim()) {
      return bien.adresse_complete;
    }
    return 'Bien non disponible';
  }, [bien]);

  const nextDue = useMemo(() => {
    if (!bail) {
      return null;
    }
    return computeNextDue(bail, transactions);
  }, [bail, transactions]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-zinc-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          Chargement de votre dashboard locataire...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-10 shadow-2xl mb-8">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.5,-40.7C85.9,-26.1,92.5,-11,91.3,3.7C90.1,18.4,81.1,32.7,71.1,45.2C61.1,57.7,50.1,68.4,36.7,75.1C23.3,81.8,7.5,84.5,-8.3,83.1C-24.1,81.7,-39.9,76.2,-53.4,67C-66.9,57.8,-78.1,44.9,-85.1,29.9C-92.1,14.9,-94.9,-2.2,-91.3,-18C-87.7,-33.8,-77.7,-48.3,-64.5,-59.5C-51.3,-70.7,-34.7,-78.6,-18.8,-80.4C-2.9,-82.2,13.1,-77.9,28.2,-73.4L45.7,-76.3Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wider">Tableau de bord</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bonjour, {tenantFirstName} 👋</h1>
              <p className="text-zinc-300">Bienvenue dans votre espace locataire personnel.</p>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 w-fit">
                <div className="relative">
                  <Bell className="w-5 h-5 text-amber-300" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{unreadCount} notification{unreadCount > 1 ? 's' : ''}</div>
                  <div className="text-zinc-400 text-xs">en attente</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions Grid */}
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-zinc-900 rounded-full"></span>
              Accès rapides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-start gap-4 rounded-2xl border ${link.borderColor} bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.color} transition-transform group-hover:scale-110`}>
                    <link.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">{link.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{link.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Prochaine échéance */}
          <section className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-zinc-900">Prochaine échéance</h2>
             </div>
             {!bail ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-600">
                Aucun bail actif trouvé. Contactez votre propriétaire pour activer votre dossier locataire.
              </div>
             ) : nextDue ? (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-zinc-900">
                      05
                    </div>
                    <div>
                      <div className="text-sm text-zinc-500">Loyer de {nextDue.monthLabel}</div>
                      <div className="font-bold text-zinc-900 text-xl">{currencyFormatter.format(nextDue.amount)}</div>
                      <div className="text-xs text-zinc-500 mt-1">Échéance: {nextDue.dueDateLabel}</div>
                    </div>
                  </div>
                  <Link href="/tenant/payment" className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20">
                    Payer maintenant <ArrowRight className="w-4 h-4" />
                  </Link>
              </div>
             ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
                Tout est à jour. Aucune échéance en attente pour votre bail actuel.
              </div>
             )}
          </section>

        </div>

        {/* Right Column - Bail Info */}
        <div className="space-y-8">
          <section className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <FileSignature className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                Détails du bail
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Bien loué</p>
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                    <p className="font-semibold text-zinc-900">{propertyTitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Début</p>
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {bail ? formatDateShort(bail.date_debut) : '-'}
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Fin</p>
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {bail ? formatDateShort(bail.date_fin) : '-'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  {bail?.bien ? (
                    <Link 
                      href={`/properties/${bail.bien}?role=tenant`}
                      className="flex items-center justify-between w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
                    >
                      <span className="font-medium text-zinc-700 group-hover:text-zinc-900">Voir la fiche du bien</span>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ) : (
                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                      La fiche du bien sera disponible dès qu'un bail actif est associé à votre compte.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
