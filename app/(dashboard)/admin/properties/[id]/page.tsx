import OwnerPropertyDetailClient from '@/components/owner/OwnerPropertyDetailClient';

interface AdminPropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPropertyDetailPage({ params }: AdminPropertyDetailPageProps) {
  const { id } = await params;

  return (
    <OwnerPropertyDetailClient
      id={id}
      backHref="/admin/properties"
      backLabel="Retour a Tous les biens"
      showOwnerActions={false}
    />
  );
}
