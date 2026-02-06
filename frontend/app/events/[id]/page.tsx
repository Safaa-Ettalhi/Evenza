import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';
import { Calendar, MapPin, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventActions } from '@/components/EventActions';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  try {
    return await apiService.getEvent(id);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: 'Événement introuvable - Evenza',
    };
  }

  return {
    title: `${event.title} - Evenza`,
    description: event.description.substring(0, 160),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger les détails de l'événement ou événement introuvable.
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

        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${isFull
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      }`}
                  >
                    {isFull ? 'Complet' : `${availableSpots} places disponibles`}
                  </span>
                  {event.status && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : event.status === 'CANCELED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                      {event.status === 'PUBLISHED'
                        ? 'Publié'
                        : event.status === 'CANCELED'
                          ? 'Annulé'
                          : 'Brouillon'}
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
            <EventActions event={event} />

          </div>
        </div>
      </main>
    </div>
  );
}
