"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminGlobalStats, AdminMonthlyPaymentTrendPoint } from '@/lib/stats-service';

const numberFormatter = new Intl.NumberFormat('fr-FR');

type TooltipValue = number | string;
type TooltipPayloadItem = {
  value: TooltipValue;
  name: string;
  color?: string;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold text-zinc-900">{label}</p>}
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="text-zinc-700">
            <span className="font-medium" style={{ color: item.color || '#27272a' }}>
              {item.name}
            </span>{' '}
            : {numberFormatter.format(Number(item.value))}
          </p>
        ))}
      </div>
    </div>
  );
}

type AdminOverviewChartsProps = {
  globalStats: AdminGlobalStats | null;
  monthlyTrend: AdminMonthlyPaymentTrendPoint[];
};

export function AdminOverviewCharts({ globalStats, monthlyTrend }: AdminOverviewChartsProps) {
  const paymentDistribution = [
    { name: 'Valides', value: globalStats?.paiements.valide ?? 0, color: '#16a34a' },
    { name: 'En attente', value: globalStats?.paiements.en_attente ?? 0, color: '#f59e0b' },
    { name: 'Echoues', value: globalStats?.paiements.echoue ?? 0, color: '#ef4444' },
    { name: 'Annules', value: globalStats?.paiements.annule ?? 0, color: '#71717a' },
  ];

  const visitConversion = [
    { name: 'Utilisees', value: globalStats?.visites.utilisees ?? 0, color: '#0ea5e9' },
    { name: 'Non utilisees', value: globalStats?.visites.non_utilisees ?? 0, color: '#a1a1aa' },
  ];

  const totalPayments = paymentDistribution.reduce((acc, item) => acc + item.value, 0);
  const totalVisits = visitConversion.reduce((acc, item) => acc + item.value, 0);
  const trendData = monthlyTrend.length > 0 ? monthlyTrend : [{ mois: 'N/A', valides: 0, enAttente: 0, echoues: 0 }];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Vue analytique</h2>
        <p className="text-sm text-zinc-600">Graphiques relies aux donnees API du backend.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-3">
            <p className="text-sm font-semibold text-zinc-900">Evolution mensuelle des paiements</p>
            <p className="text-xs text-zinc-500">Valides, en attente et echoues sur les 6 derniers mois</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="valides" name="Valides" stroke="#16a34a" fill="#86efac" fillOpacity={0.35} strokeWidth={2} />
                <Area type="monotone" dataKey="enAttente" name="En attente" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.3} strokeWidth={2} />
                <Area type="monotone" dataKey="echoues" name="Echoues" stroke="#ef4444" fill="#fecaca" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-semibold text-zinc-900">Repartition des paiements</p>
            <p className="text-xs text-zinc-500">Total: {numberFormatter.format(totalPayments)} transactions</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-sm font-semibold text-zinc-900">Conversion des visites virtuelles</p>
          <p className="text-xs text-zinc-500">Total: {numberFormatter.format(totalVisits)} visites</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitConversion} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {visitConversion.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
