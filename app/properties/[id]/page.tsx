
import PropertyDetailClient from '@/components/PropertyDetailClient';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const { id } = await params;
  const { role } = await searchParams;

  return <PropertyDetailClient id={id} role={role} />;
}
