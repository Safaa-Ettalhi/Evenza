import Link from 'next/link';
import { Event } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/EventCard';
import { Calendar, Users, ArrowRight, TrendingUp, Ticket } from 'lucide-react';

function getRegisteredCount(events: Event[]): number {
  return events.reduce((sum, e) => sum + (e.capacity - (e.availableSpots ?? e.capacity)), 0);
}

function getFillRate(events: Event[]): number {
  const total = events.reduce((sum, e) => sum + e.capacity, 0);
  return total > 0 ? Math.round((getRegisteredCount(events) / total) * 100) : 0;
}

interface PublicHomePageProps {
  events: Event[];
}

export function PublicHomePage({ events }: PublicHomePageProps) {
  const upcomingEvents = events.slice(0, 3);
  const registeredCount = getRegisteredCount(events);
  const fillRate = getFillRate(events);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-7xl lg:text-8xl">
              Trouvez des{' '}
              <span className="text-gray-900 dark:text-white">événements incroyables</span>{' '}
              dans votre ville
            </h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
              Réservez votre place pour des formations, ateliers, conférences et bien plus encore.
              Rejoignez une communauté passionnée d'apprenants.
            </p>
            <div className="flex flex-col items-start justify-start gap-4 sm:flex-row">
              <Button size="lg" className="group bg-gray-900 text-white text-lg px-8 py-6 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" asChild>
                <Link href="#events">
                  Voir les événements
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-gray-900 dark:border-white" asChild>
                <Link href="/register">Créer un compte</Link>
              </Button>
            </div>
            {events.length > 0 && (
              <div className="mt-12 flex items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-900 dark:text-white" />
                  <span className="font-semibold">{events.length}</span> événements
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-900 dark:text-white" />
                  <span className="font-semibold">{registeredCount}</span> participants
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {events.length > 0 && (
        <section className="border-y border-gray-200 bg-gray-50 dark:bg-[#141414]">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-gray-900 p-4 dark:bg-white">
                  <Ticket className="h-8 w-8 text-white dark:text-gray-900" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {events.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Événements disponibles</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-gray-900 p-4 dark:bg-white">
                  <Users className="h-8 w-8 text-white dark:text-gray-900" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {registeredCount}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Participants inscrits</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-gray-900 p-4 dark:bg-white">
                  <TrendingUp className="h-8 w-8 text-white dark:text-gray-900" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {fillRate}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">Taux de remplissage</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="bg-white dark:bg-[#0a0a0a] py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
                Événements à venir
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Ne manquez pas ces opportunités exceptionnelles d'apprentissage et de networking
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
            {events.length > 3 && (
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg" className="border-2 border-gray-900 dark:border-white" asChild>
                  <Link href="#events">
                    Voir tous les événements
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Events Section */}
      <section id="events" className="bg-gray-50 dark:bg-[#141414] py-16">
        <div className="container mx-auto px-4">
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
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" asChild>
                <Link href="/register">Créer un compte pour être notifié</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
                  Tous les événements
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Explorez notre catalogue complet d'événements
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 dark:bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl font-bold text-white dark:text-gray-900 md:text-5xl">
              Prêt à commencer ?
            </h2>
            <p className="mb-8 text-xl text-gray-300 dark:text-gray-600">
              Rejoignez notre communauté et réservez votre place dès maintenant
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800" asChild>
                <Link href="/register">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-black hover:bg-white/70 text-lg bg-white/90 px-8 py-6 dark:border-gray-900 dark:text-gray-900 dark:hover:bg-gray-900/10" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white dark:bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="mb-4 inline-block text-2xl font-bold text-gray-900 dark:text-white">
                Evenza
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                La plateforme de réservation d'événements pour tous vos besoins de formation et de networking.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Navigation</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="#events" className="hover:text-gray-900 dark:hover:text-white">
                    Événements
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-gray-900 dark:hover:text-white">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-gray-900 dark:hover:text-white">
                    Inscription
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Informations</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#" className="hover:text-gray-900 dark:hover:text-white">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900 dark:hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900 dark:hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Légal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#" className="hover:text-gray-900 dark:hover:text-white">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900 dark:hover:text-white">
                    Conditions d'utilisation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2026 Evenza. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
