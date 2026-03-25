"use client";

import { useEffect, useState } from "react";
import { StatsService } from "@/lib/stats-service";
import { BalanceCard } from "@/components/comptabilite/BalanceCard";
import { Loader2, TrendingUp, TrendingDown, BarChart2, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OwnerStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const response = await StatsService.getDashboard();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || "Erreur lors du chargement des statistiques");
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Statistiques détaillées</h1>
        <p className="text-sm text-zinc-600 mb-4">Analyse avancée de la performance de votre patrimoine immobilier.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 rounded-xl text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Revenus & Dépenses</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm">Revenus ce mois :</span>
                <span className="font-bold text-green-700">{formatCurrency(stats.revenus_mois)}</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm">Dépenses ce mois :</span>
                <span className="font-bold text-red-700">{formatCurrency(stats.depenses_mois)}</span>
              </div>
              <div className="flex items-center gap-3">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Bénéfice net :</span>
                <span className="font-bold text-blue-700">{formatCurrency(stats.benefice_net)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" /> Répartition des biens</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm">Biens loués :</span>
                <span className="font-bold text-emerald-700">{stats.biens_loues}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">Biens vacants :</span>
                <span className="font-bold text-orange-700">{stats.biens_vacants}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">Total biens :</span>
                <span className="font-bold text-zinc-900">{stats.total_biens}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div>
        <BalanceCard />
      </div>
    </div>
  );
}
