import { Event, API_URL } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { Header } from '@/components/Header';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CataloguePage({ searchParams }: Props) {
  const events = await getEvents();
  const { page } = await searchParams;

  const currentPage = Number(page) || 1;
  const itemsPerPage = 9;
  const totalPages = Math.ceil(events.length / itemsPerPage);

  const displayedEvents = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-4 border-t border-gray-100 dark:border-gray-800">
                {currentPage > 1 ? (
                  <Link
                    href={`/catalogue?page=${currentPage - 1}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Précédent
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Précédent
                  </Button>
                )}

                <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                  Page {currentPage} sur {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/catalogue?page=${currentPage + 1}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Suivant
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Suivant
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
