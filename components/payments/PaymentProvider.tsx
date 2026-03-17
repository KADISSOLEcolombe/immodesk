"use client";

import { jsPDF } from 'jspdf';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'canceled';
export type PaymentChannel = 'mobile_money' | 'card' | 'manual';
export type MobileOperator = 'mix' | 'moov' | 'tmoney';
export type InterventionType = 'cancel_24h' | 'partial_refund' | 'status_update';

export type PaymentRecord = {
  id: string;
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  channel: PaymentChannel;
  operator?: MobileOperator;
  phone?: string;
  cardLast4?: string;
  status: PaymentStatus;
  source: 'auto' | 'manual';
  createdAt: string;
  reference: string;
  refundedAmount: number;
  receiptGenerated: boolean;
  receiptEmailed: boolean;
};

export type PaymentIntervention = {
  id: string;
  paymentId: string;
  paymentReference: string;
  type: InterventionType;
  actor: string;
  reason: string;
  amount: number;
  createdAt: string;
  details: string;
};

type PaymentFilters = {
  from?: string;
  to?: string;
  status?: 'all' | PaymentStatus;
  channel?: 'all' | PaymentChannel;
};

type StartMobilePayload = {
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  operator: MobileOperator;
  phone: string;
};

type StartCardPayload = {
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type StartManualPayload = {
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
};

type PaymentsContextValue = {
  payments: PaymentRecord[];
  interventions: PaymentIntervention[];
  startMobileMoneyPayment: (payload: StartMobilePayload) => PaymentRecord;
  confirmMobileMoneyPayment: (id: string, smsCode: string) => PaymentRecord | null;
  startCardPayment: (payload: StartCardPayload) => PaymentRecord;
  startManualPayment: (payload: StartManualPayload) => PaymentRecord;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  cancelPaymentWithin24h: (id: string, reason: string, actor: string) => { ok: boolean; message: string };
  partialRefundPayment: (id: string, amount: number, reason: string, actor: string) => { ok: boolean; message: string };
  isCancelableWithin24h: (payment: PaymentRecord) => boolean;
  getNetAmount: (payment: PaymentRecord) => number;
  getOwnerBalance: () => number;
  markReceiptGenerated: (id: string) => void;
  markReceiptEmailed: (id: string) => void;
  filterPayments: (filters: PaymentFilters) => PaymentRecord[];
  exportPaymentsCsv: (records: PaymentRecord[]) => void;
  exportPaymentsPdf: (records: PaymentRecord[], title: string) => void;
  exportInterventionsCsv: (records: PaymentIntervention[]) => void;
  exportInterventionsPdf: (records: PaymentIntervention[], title: string) => void;
};

const STORAGE_KEY = 'immodesk.payments.v1';
const STORAGE_AUDIT_KEY = 'immodesk.paymentInterventions.v1';

const initialPayments: PaymentRecord[] = [
  {
    id: 'trx-1',
    tenantName: 'Kossi Mensah',
    propertyTitle: 'Appartement meublé à Bè',
    month: 'février 2026',
    amount: 195000,
    channel: 'mobile_money',
    operator: 'mix',
    phone: '90000000',
    status: 'success',
    source: 'auto',
    createdAt: '2026-02-05T09:10:00.000Z',
    reference: 'PAY-TRX-1',
    refundedAmount: 0,
    receiptGenerated: true,
    receiptEmailed: true,
  },
  {
    id: 'trx-2',
    tenantName: 'Afi Koutou',
    propertyTitle: 'Studio moderne proche université',
    month: 'mars 2026',
    amount: 75000,
    channel: 'manual',
    status: 'pending',
    source: 'manual',
    createdAt: '2026-03-02T10:20:00.000Z',
    reference: 'PAY-TRX-2',
    refundedAmount: 0,
    receiptGenerated: false,
    receiptEmailed: false,
  },
];

const initialInterventions: PaymentIntervention[] = [];

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString('fr-TG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function luhnCheck(value: string) {
  const digits = value.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [interventions, setInterventions] = useState<PaymentIntervention[]>(initialInterventions);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        const parsed = JSON.parse(storedValue) as PaymentRecord[];
        if (Array.isArray(parsed)) {
          setPayments(parsed);
        }
      }

      const storedAudit = window.localStorage.getItem(STORAGE_AUDIT_KEY);
      if (storedAudit) {
        const parsedAudit = JSON.parse(storedAudit) as PaymentIntervention[];
        if (Array.isArray(parsedAudit)) {
          setInterventions(parsedAudit);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_AUDIT_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    window.localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(interventions));
  }, [payments, interventions, hydrated]);

  const getNetAmount = (payment: PaymentRecord) => Math.max(payment.amount - payment.refundedAmount, 0);

  const isCancelableWithin24h = (payment: PaymentRecord) => {
    if (payment.status !== 'success' && payment.status !== 'refunded') {
      return false;
    }

    const elapsedMs = Date.now() - new Date(payment.createdAt).getTime();
    return elapsedMs <= 24 * 60 * 60 * 1000;
  };

  const pushIntervention = (entry: Omit<PaymentIntervention, 'id' | 'createdAt'>) => {
    const next: PaymentIntervention = {
      ...entry,
      id: `int-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setInterventions((current) => [next, ...current]);
  };

  const startMobileMoneyPayment = (payload: StartMobilePayload) => {
    const nowIso = new Date().toISOString();
    const record: PaymentRecord = {
      id: `trx-${Date.now()}`,
      tenantName: payload.tenantName,
      propertyTitle: payload.propertyTitle,
      month: payload.month,
      amount: payload.amount,
      channel: 'mobile_money',
      operator: payload.operator,
      phone: payload.phone,
      status: 'pending',
      source: 'auto',
      createdAt: nowIso,
      reference: `PAY-${Date.now()}`,
      refundedAmount: 0,
      receiptGenerated: false,
      receiptEmailed: false,
    };

    setPayments((current) => [record, ...current]);
    return record;
  };

  const confirmMobileMoneyPayment = (id: string, smsCode: string) => {
    let updatedRecord: PaymentRecord | null = null;

    setPayments((current) =>
      current.map((payment) => {
        if (payment.id !== id) {
          return payment;
        }

        const success = smsCode.trim() === '1234';
        const nextValue = {
          ...payment,
          status: success ? 'success' : 'failed',
        } satisfies PaymentRecord;

        updatedRecord = nextValue;
        return nextValue;
      }),
    );

    return updatedRecord;
  };

  const startCardPayment = (payload: StartCardPayload) => {
    const digits = payload.cardNumber.replace(/\s+/g, '');
    const validFormat = luhnCheck(payload.cardNumber) && /^\d{2}\/\d{2}$/.test(payload.expiry) && /^\d{3,4}$/.test(payload.cvv);
    const accepted = validFormat && Number(digits[digits.length - 1]) % 2 === 0;

    const record: PaymentRecord = {
      id: `trx-${Date.now()}`,
      tenantName: payload.tenantName,
      propertyTitle: payload.propertyTitle,
      month: payload.month,
      amount: payload.amount,
      channel: 'card',
      cardLast4: digits.slice(-4),
      status: accepted ? 'success' : 'failed',
      source: 'auto',
      createdAt: new Date().toISOString(),
      reference: `PAY-${Date.now()}`,
      refundedAmount: 0,
      receiptGenerated: false,
      receiptEmailed: false,
    };

    setPayments((current) => [record, ...current]);
    return record;
  };

  const startManualPayment = (payload: StartManualPayload) => {
    const record: PaymentRecord = {
      id: `trx-${Date.now()}`,
      tenantName: payload.tenantName,
      propertyTitle: payload.propertyTitle,
      month: payload.month,
      amount: payload.amount,
      channel: 'manual',
      status: 'pending',
      source: 'manual',
      createdAt: new Date().toISOString(),
      reference: `PAY-${Date.now()}`,
      refundedAmount: 0,
      receiptGenerated: false,
      receiptEmailed: false,
    };

    setPayments((current) => [record, ...current]);
    return record;
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    setPayments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));

    const target = payments.find((item) => item.id === id);
    if (target) {
      pushIntervention({
        paymentId: target.id,
        paymentReference: target.reference,
        type: 'status_update',
        actor: 'admin',
        reason: `Mise à jour vers ${status}`,
        amount: 0,
        details: `Statut ${target.status} -> ${status}`,
      });
    }
  };

  const cancelPaymentWithin24h = (id: string, reason: string, actor: string) => {
    const target = payments.find((item) => item.id === id);
    if (!target) {
      return { ok: false, message: 'Paiement introuvable.' };
    }

    if (!isCancelableWithin24h(target)) {
      return { ok: false, message: 'Annulation impossible: délai de 24h dépassé.' };
    }

    setPayments((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'canceled',
              refundedAmount: item.amount,
            }
          : item,
      ),
    );

    pushIntervention({
      paymentId: target.id,
      paymentReference: target.reference,
      type: 'cancel_24h',
      actor,
      reason,
      amount: target.amount,
      details: 'Annulation complète < 24h',
    });

    return { ok: true, message: 'Paiement annulé avec remboursement complet.' };
  };

  const partialRefundPayment = (id: string, amount: number, reason: string, actor: string) => {
    const target = payments.find((item) => item.id === id);
    if (!target) {
      return { ok: false, message: 'Paiement introuvable.' };
    }

    if (target.status !== 'success' && target.status !== 'refunded') {
      return { ok: false, message: 'Remboursement partiel autorisé uniquement sur un paiement validé.' };
    }

    const remaining = getNetAmount(target);
    if (amount <= 0 || amount > remaining) {
      return { ok: false, message: 'Montant de remboursement invalide.' };
    }

    setPayments((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const refundedAmount = item.refundedAmount + amount;
        return {
          ...item,
          refundedAmount,
          status: refundedAmount >= item.amount ? 'refunded' : item.status,
        };
      }),
    );

    pushIntervention({
      paymentId: target.id,
      paymentReference: target.reference,
      type: 'partial_refund',
      actor,
      reason,
      amount,
      details: `Remboursement partiel de ${amount} FCFA`,
    });

    return { ok: true, message: 'Remboursement partiel appliqué.' };
  };

  const getOwnerBalance = () => {
    return payments.reduce((sum, item) => {
      if (item.status === 'failed' || item.status === 'pending') {
        return sum;
      }

      return sum + getNetAmount(item);
    }, 0);
  };

  const markReceiptGenerated = (id: string) => {
    setPayments((current) => current.map((item) => (item.id === id ? { ...item, receiptGenerated: true } : item)));
  };

  const markReceiptEmailed = (id: string) => {
    setPayments((current) => current.map((item) => (item.id === id ? { ...item, receiptEmailed: true } : item)));
  };

  const filterPayments = (filters: PaymentFilters) => {
    const fromTs = filters.from ? new Date(filters.from).getTime() : null;
    const toTs = filters.to ? new Date(filters.to).getTime() : null;

    return payments.filter((item) => {
      const itemTs = new Date(item.createdAt).getTime();
      const matchesFrom = fromTs === null || itemTs >= fromTs;
      const matchesTo = toTs === null || itemTs <= toTs;
      const matchesStatus = !filters.status || filters.status === 'all' || item.status === filters.status;
      const matchesChannel = !filters.channel || filters.channel === 'all' || item.channel === filters.channel;

      return matchesFrom && matchesTo && matchesStatus && matchesChannel;
    });
  };

  const exportPaymentsCsv = (records: PaymentRecord[]) => {
    const header = ['Reference', 'Date', 'Locataire', 'Bien', 'Mois', 'Montant', 'Rembourse', 'Net', 'Canal', 'Statut', 'Source'];
    const rows = records.map((item) => [
      item.reference,
      formatDateLabel(item.createdAt),
      item.tenantName,
      item.propertyTitle,
      item.month,
      String(item.amount),
      String(item.refundedAmount),
      String(getNetAmount(item)),
      item.channel,
      item.status,
      item.source,
    ]);

    const csvContent = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentsPdf = (records: PaymentRecord[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ImmoDesk Togo', 14, 18);
    doc.setFontSize(12);
    doc.text(title, 14, 26);

    let y = 36;
    records.slice(0, 20).forEach((item) => {
      doc.setFontSize(10);
      doc.text(`${item.reference} | ${formatDateLabel(item.createdAt)} | ${item.tenantName}`, 14, y);
      y += 6;
      doc.text(`${item.propertyTitle} | ${item.month} | ${item.channel} | ${item.status} | net ${getNetAmount(item)} FCFA`, 14, y);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`paiements-${Date.now()}.pdf`);
  };

  const exportInterventionsCsv = (records: PaymentIntervention[]) => {
    const header = ['Date', 'Acteur', 'Type', 'Reference', 'Montant', 'Raison', 'Details'];
    const rows = records.map((item) => [
      formatDateLabel(item.createdAt),
      item.actor,
      item.type,
      item.paymentReference,
      String(item.amount),
      item.reason,
      item.details,
    ]);

    const csvContent = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-remboursements-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportInterventionsPdf = (records: PaymentIntervention[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ImmoDesk Togo', 14, 18);
    doc.setFontSize(12);
    doc.text(title, 14, 26);

    let y = 36;
    records.slice(0, 20).forEach((item) => {
      doc.setFontSize(10);
      doc.text(`${formatDateLabel(item.createdAt)} | ${item.actor} | ${item.type}`, 14, y);
      y += 6;
      doc.text(`${item.paymentReference} | ${item.amount} FCFA | ${item.reason}`, 14, y);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`audit-remboursements-${Date.now()}.pdf`);
  };

  const value = {
    payments,
    interventions,
    startMobileMoneyPayment,
    confirmMobileMoneyPayment,
    startCardPayment,
    startManualPayment,
    updatePaymentStatus,
    cancelPaymentWithin24h,
    partialRefundPayment,
    isCancelableWithin24h,
    getNetAmount,
    getOwnerBalance,
    markReceiptGenerated,
    markReceiptEmailed,
    filterPayments,
    exportPaymentsCsv,
    exportPaymentsPdf,
    exportInterventionsCsv,
    exportInterventionsPdf,
  };

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentsContext);

  if (!context) {
    throw new Error('usePayments must be used inside PaymentsProvider');
  }

  return context;
}
