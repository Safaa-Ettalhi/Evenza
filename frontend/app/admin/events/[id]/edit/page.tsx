'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Event } from '@/lib/api';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);
    setError(null);
    apiService
      .getEventAdmin(id, token)
      .then(setEvent)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'événement');
        setEvent(null);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleSubmit = async (data: Parameters<typeof apiService.updateEvent>[1]) => {
    if (!token) {
      setError('Vous devez être connecté pour modifier un événement');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.updateEvent(id, data, token);
      router.push('/admin/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la modification de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin/events" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux événements
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Événement non trouvé.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/admin/events">Retour à la liste</Link>
          </Button>
        </div>
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
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/events" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux événements
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Modifier l&apos;événement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modifiez les informations de l&apos;événement ci-dessous. Les changements seront enregistrés immédiatement.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {event.status === 'PUBLISHED' && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Note :</strong> Cet événement est publié et visible par les participants. Les modifications seront immédiatement visibles.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Informations de l&apos;événement</CardTitle>
            <CardDescription>
              Modifiez les champs nécessaires. Tous les champs sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              submitLabel="Enregistrer les modifications"
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
