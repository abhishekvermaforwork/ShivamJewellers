'use client';

import { useParams } from 'next/navigation';
import { ClientForm } from '@/components/clients/ClientForm';

export default function EditClientPage() {
  const params = useParams();
  const id = String(params.id);
  return <ClientForm mode="edit" clientId={id} />;
}
