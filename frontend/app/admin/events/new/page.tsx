'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const { token } = useAuth();

  const handleSubmit = async (data: Parameters<typeof apiService.createEvent>[0]) => {
    if (!token) return;
    await apiService.createEvent(data, token);
    router.push('/admin/events');
    router.refresh();
  };

  return (
    <div>
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/admin/events" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Créer un événement
      </h1>
      <EventForm onSubmit={handleSubmit} submitLabel="Créer l'événement" />
    </div>
  );
}
