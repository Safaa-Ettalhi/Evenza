'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Parameters<typeof apiService.createEvent>[0]) => {
    if (!token) {
      setError('Vous devez être connecté pour créer un événement');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.createEvent(data, token);
      router.push('/admin/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
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
            Créer un nouvel événement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Remplissez le formulaire ci-dessous pour créer un nouvel événement. L'événement sera créé en brouillon et vous pourrez le publier ensuite.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Astuce :</strong> Après la création, vous pourrez publier l'événement depuis la liste des événements pour qu'il soit visible par les participants.
          </AlertDescription>
        </Alert>

        <Card className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Informations de l'événement</CardTitle>
            <CardDescription>
              Tous les champs sont obligatoires. Assurez-vous de vérifier les informations avant de créer l'événement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm onSubmit={handleSubmit} submitLabel="Créer l'événement" isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
