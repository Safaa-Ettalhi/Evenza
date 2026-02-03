'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Event } from '@/lib/api';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function formatDateTimeForInput(isoDate: string): string {
  const d = new Date(isoDate);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiService
      .getEvent(id)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: Parameters<typeof apiService.updateEvent>[1]) => {
    if (!token) return;
    await apiService.updateEvent(id, data, token);
    router.push('/admin/events');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Événement non trouvé.
        <Button variant="link" asChild>
          <Link href="/admin/events">Retour aux événements</Link>
        </Button>
      </div>
    );
  }

  const defaultValues = {
    title: event.title,
    description: event.description,
    date: formatDateTimeForInput(event.date),
    location: event.location,
    capacity: event.capacity,
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
        Modifier l'événement
      </h1>
      <EventForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
