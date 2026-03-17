"use client";

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type RoleScope = 'owner' | 'admin';

export type ReportArchiveItem = {
  id: string;
  title: string;
  role: RoleScope;
  fileName: string;
  generatedAt: string;
  emailed: boolean;
};

type OwnerPaymentRow = {
  reference: string;
  date: string;
  property: string;
  tenant: string;
  month: string;
  amount: number;
  status: string;
};

type OwnerReportPayload = {
  periodLabel: string;
  ownerName: string;
  generatedBy: string;
  payments: OwnerPaymentRow[];
};

type AdminStatsPayload = {
  label: string;
  value: string;
};

type AdminIncidentPayload = {
  label: string;
  detail: string;
  status: string;
};

type AdminActivityPayload = {
  user: string;
  action: string;
  date: string;
};

type AdminReportPayload = {
  generatedBy: string;
  stats: AdminStatsPayload[];
  incidents: AdminIncidentPayload[];
  activities: AdminActivityPayload[];
};

type TableReportPayload = {
  title: string;
  role: RoleScope;
  generatedBy: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

type ReportsContextValue = {
  archives: ReportArchiveItem[];
  exportOwnerPeriodicReport: (payload: OwnerReportPayload) => ReportArchiveItem;
  exportAdminGlobalReport: (payload: AdminReportPayload) => ReportArchiveItem;
  exportTableReport: (payload: TableReportPayload) => ReportArchiveItem;
  emailArchiveItem: (id: string) => void;
};

const STORAGE_KEY = 'immodesk.reports.v1';

const ReportsContext = createContext<ReportsContextValue | null>(null);

function nowLabel() {
  return new Date().toLocaleString('fr-TG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('ImmoDesk Togo', 14, 16);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.text(title, 14, 36);
  doc.setFontSize(10);
  doc.text(subtitle, 14, 43);
}

function drawFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();

  for (let index = 1; index <= pages; index += 1) {
    doc.setPage(index);
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Généré le ${nowLabel()} · Page ${index}/${pages}`, 14, 292);
  }
}

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [archives, setArchives] = useState<ReportArchiveItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed = JSON.parse(storedValue) as ReportArchiveItem[];
        if (Array.isArray(parsed)) {
          setArchives(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
  }, [archives, hydrated]);

  const pushArchive = (item: Omit<ReportArchiveItem, 'id' | 'generatedAt' | 'emailed'>) => {
    const nextItem: ReportArchiveItem = {
      ...item,
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      emailed: false,
    };

    setArchives((current) => [nextItem, ...current]);
    return nextItem;
  };

  const exportOwnerPeriodicReport = (payload: OwnerReportPayload) => {
    const doc = new jsPDF();
    drawHeader(doc, 'Rapport propriétaire - Paiements', `Période: ${payload.periodLabel}`);

    doc.setFontSize(10);
    doc.text(`Propriétaire: ${payload.ownerName}`, 14, 52);
    doc.text(`Édité par: ${payload.generatedBy}`, 14, 58);

    autoTable(doc, {
      startY: 66,
      head: [['Réf', 'Date', 'Bien/Immeuble', 'Locataire', 'Mois', 'Montant', 'Statut']],
      body: payload.payments.map((item) => [
        item.reference,
        item.date,
        item.property,
        item.tenant,
        item.month,
        `${item.amount} FCFA`,
        item.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
    });

    const groupedByProperty = payload.payments.reduce<Record<string, number>>((acc, item) => {
      acc[item.property] = (acc[item.property] || 0) + item.amount;
      return acc;
    }, {});

    const groupedByTenant = payload.payments.reduce<Record<string, number>>((acc, item) => {
      acc[item.tenant] = (acc[item.tenant] || 0) + item.amount;
      return acc;
    }, {});

    const bodyStart = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;

    doc.setFontSize(11);
    doc.text('Récapitulatif par bien/immeuble', 14, bodyStart + 10);
    autoTable(doc, {
      startY: bodyStart + 14,
      head: [['Bien', 'Total']],
      body: Object.entries(groupedByProperty).map(([key, value]) => [key, `${value} FCFA`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42] },
    });

    const secondY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? bodyStart + 32;
    doc.setFontSize(11);
    doc.text('Récapitulatif locataires', 14, secondY + 10);
    autoTable(doc, {
      startY: secondY + 14,
      head: [['Locataire', 'Total']],
      body: Object.entries(groupedByTenant).map(([key, value]) => [key, `${value} FCFA`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42] },
    });

    const signY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? secondY + 32;
    doc.setFontSize(10);
    doc.text('Signature propriétaire: ____________________', 14, signY + 16);
    doc.text('Signature gestionnaire: ____________________', 110, signY + 16);

    drawFooter(doc);

    const fileName = `rapport-proprietaire-${Date.now()}.pdf`;
    doc.save(fileName);

    return pushArchive({
      title: `Rapport propriétaire (${payload.periodLabel})`,
      role: 'owner',
      fileName,
    });
  };

  const exportAdminGlobalReport = (payload: AdminReportPayload) => {
    const doc = new jsPDF();
    drawHeader(doc, 'Rapport administration globale', 'Synthèse plateforme');

    doc.setFontSize(10);
    doc.text(`Édité par: ${payload.generatedBy}`, 14, 52);

    autoTable(doc, {
      startY: 60,
      head: [['Statistique', 'Valeur']],
      body: payload.stats.map((item) => [item.label, item.value]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
    });

    const incidentsY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 92;
    doc.setFontSize(11);
    doc.text('Incidents', 14, incidentsY + 10);
    autoTable(doc, {
      startY: incidentsY + 14,
      head: [['Incident', 'Détail', 'Statut']],
      body: payload.incidents.map((item) => [item.label, item.detail, item.status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42] },
    });

    const activitiesY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? incidentsY + 40;
    doc.setFontSize(11);
    doc.text('Activité des utilisateurs', 14, activitiesY + 10);
    autoTable(doc, {
      startY: activitiesY + 14,
      head: [['Utilisateur', 'Action', 'Date']],
      body: payload.activities.map((item) => [item.user, item.action, item.date]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42] },
    });

    drawFooter(doc);

    const fileName = `rapport-admin-${Date.now()}.pdf`;
    doc.save(fileName);

    return pushArchive({
      title: 'Rapport administration globale',
      role: 'admin',
      fileName,
    });
  };

  const exportTableReport = (payload: TableReportPayload) => {
    const doc = new jsPDF();
    drawHeader(doc, payload.title, `Édité par: ${payload.generatedBy}`);

    autoTable(doc, {
      startY: 54,
      head: [payload.headers],
      body: payload.rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
    });

    drawFooter(doc);

    const fileName = `table-${Date.now()}.pdf`;
    doc.save(fileName);

    return pushArchive({
      title: payload.title,
      role: payload.role,
      fileName,
    });
  };

  const emailArchiveItem = (id: string) => {
    setArchives((current) => current.map((item) => (item.id === id ? { ...item, emailed: true } : item)));
  };

  const value: ReportsContextValue = {
    archives,
    exportOwnerPeriodicReport,
    exportAdminGlobalReport,
    exportTableReport,
    emailArchiveItem,
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const context = useContext(ReportsContext);

  if (!context) {
    throw new Error('useReports must be used inside ReportsProvider');
  }

  return context;
}
