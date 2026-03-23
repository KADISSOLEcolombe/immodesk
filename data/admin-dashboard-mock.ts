export interface AdminMonthlyPaymentTrendPoint {
  mois: string;
  valides: number;
  enAttente: number;
  echoues: number;
}

export interface AdminPaymentDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface AdminVisitConversionPoint {
  name: string;
  value: number;
  color: string;
}

export const adminMonthlyPaymentTrendMock: AdminMonthlyPaymentTrendPoint[] = [
  { mois: 'Jan', valides: 28, enAttente: 6, echoues: 4 },
  { mois: 'Fev', valides: 34, enAttente: 7, echoues: 5 },
  { mois: 'Mar', valides: 31, enAttente: 9, echoues: 3 },
  { mois: 'Avr', valides: 38, enAttente: 8, echoues: 4 },
  { mois: 'Mai', valides: 42, enAttente: 5, echoues: 4 },
  { mois: 'Jun', valides: 45, enAttente: 6, echoues: 2 },
];

export const adminPaymentDistributionMock: AdminPaymentDistributionPoint[] = [
  { name: 'Valides', value: 218, color: '#16a34a' },
  { name: 'En attente', value: 41, color: '#f59e0b' },
  { name: 'Echoues', value: 22, color: '#ef4444' },
  { name: 'Annules', value: 13, color: '#71717a' },
];

export const adminVisitConversionMock: AdminVisitConversionPoint[] = [
  { name: 'Utilisees', value: 164, color: '#0ea5e9' },
  { name: 'Non utilisees', value: 58, color: '#a1a1aa' },
];
