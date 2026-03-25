"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import OwnerPropertyDetailClient from '@/components/owner/OwnerPropertyDetailClient';

interface AdminPropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminPropertyDetailPage({ params }: AdminPropertyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const handleEditClick = (propertyId: string) => {
    router.push(`/admin/properties?edit=${propertyId}`);
  };

  return (
    <OwnerPropertyDetailClient
      id={id}
      backHref="/admin/properties"
      backLabel="Retour a Tous les biens"
      preferHistoryBack
      showOwnerActions={false}
      onEditClick={handleEditClick}
    />
  );
}
