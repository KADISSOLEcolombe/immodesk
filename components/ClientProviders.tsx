"use client";

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { PaymentsProvider } from '@/components/payments/PaymentProvider';
import { ReportsProvider } from '@/components/reports/ReportProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { VirtualVisitProvider } from '@/components/virtual-visits/VirtualVisitProvider';
import ToastContainer from '@/components/ui/ToastContainer';

export default function ClientProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNotifications = pathname === '/login' || pathname === '/register';

  return (
    <ThemeProvider>
      <NotificationProvider>
        <PaymentsProvider>
          <ReportsProvider>
            <VirtualVisitProvider>
              {/* <ThemeToggle /> */}
              {!hideNotifications && <NotificationCenter />}
              <ToastContainer />
              {children}
            </VirtualVisitProvider>
          </ReportsProvider>
        </PaymentsProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
