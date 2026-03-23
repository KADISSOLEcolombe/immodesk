
import PropertyDetailClient from '@/components/PropertyDetailClient';
import { redirect } from 'next/navigation';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const { id } = await params;
  const { role } = await searchParams;

  if (role === 'owner' || role === 'proprietaire') {
    redirect(`/owner/properties/${id}`);
  }

  return <PropertyDetailClient id={id} role={role} />;
}
