import OwnerPropertyDetailClient from '@/components/owner/OwnerPropertyDetailClient';

interface OwnerPropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerPropertyDetailPage({ params }: OwnerPropertyDetailPageProps) {
  const { id } = await params;

  return <OwnerPropertyDetailClient id={id} />;
}
