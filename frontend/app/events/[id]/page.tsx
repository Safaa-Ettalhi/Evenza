'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { apiService, Event } from '@/lib/api';
import { Calendar, MapPin, Users, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const eventId = params.id as string;

  useEffect(() => {
    async function fetchEvent() {
      try {
        setIsLoading(true);
        const eventData = await apiService.getEvent(eventId);
        setEvent(eventData);
      } catch {
        setError("Impossible de charger les détails de l'événement");
      } finally {
        setIsLoading(false);
      }
    }

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleReserve = async () => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    if (!event) return;

    try {
      setIsReserving(true);
      setError(null);
      setSuccess(null);

      await apiService.createReservation({ eventId: typeof event._id === 'string' ? event._id : String(event._id) }, token);
      
      setSuccess('Votre réservation a été créée avec succès ! Elle est en attente de confirmation.');
      
      const updatedEvent = await apiService.getEvent(eventId);
      setEvent(updatedEvent);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la réservation');
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Événement introuvable'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const availableSpots = event.availableSpots ?? event.capacity;
  const isFull = availableSpots === 0;
  const isPublished = event.status === 'PUBLISHED';
  const canReserve = isAuthenticated && isPublished && !isFull && user?.role === 'PARTICIPANT';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isFull
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    }`}
                  >
                    {isFull ? 'Complet' : `${availableSpots} places disponibles`}
                  </span>
                  {event.status && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : event.status === 'CANCELED'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {event.status === 'PUBLISHED' ? 'Publié' : event.status === 'CANCELED' ? 'Annulé' : 'Brouillon'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                  <Calendar className="h-6 w-6 text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Date et heure
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {eventDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-base text-gray-600 dark:text-gray-400">
                    {eventDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                  <MapPin className="h-6 w-6 text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Lieu
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.location}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                  <Users className="h-6 w-6 text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Capacité
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {event.capacity - availableSpots} / {event.capacity} participants
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-gray-900 transition-all duration-500 dark:bg-white"
                      style={{
                        width: `${((event.capacity - availableSpots) / event.capacity) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {canReserve && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <Button
                  onClick={handleReserve}
                  disabled={isReserving || isFull || !isPublished}
                  className="w-full md:w-auto bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  size="lg"
                >
                  {isReserving ? 'Réservation en cours...' : 'Réserver ma place'}
                </Button>
              </div>
            )}

            {!isAuthenticated && isPublished && !isFull && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous devez être connecté pour réserver.{' '}
                    <Link href="/login" className="underline font-medium">
                      Se connecter
                    </Link>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isAuthenticated && user?.role !== 'PARTICIPANT' && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seuls les participants peuvent réserver des événements.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
