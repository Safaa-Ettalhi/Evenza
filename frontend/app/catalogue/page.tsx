import { Event, API_URL } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { Header } from '@/components/Header';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 2000;

async function getEvents(): Promise<Event[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${API_URL}/events`, { next: { revalidate: 60 }, signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

export default async function CataloguePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Catalogue des événements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Explorez tous les événements disponibles.
        </p>

        {events.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-6 inline-flex rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Aucun événement disponible pour le moment
            </h3>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              Revenez bientôt pour découvrir nos prochains événements !
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
