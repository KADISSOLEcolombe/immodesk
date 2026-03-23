import AdminSubmissionDetailClient from '@/components/dashboard/AdminSubmissionDetailClient';

interface AdminSubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubmissionDetailPage({ params }: AdminSubmissionDetailPageProps) {
  const { id } = await params;

  return <AdminSubmissionDetailClient id={id} />;
}
