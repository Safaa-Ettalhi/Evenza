'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Ticket, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mon espace
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Bienvenue, consultez les événements et vos réservations.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414] hover:shadow-md transition-shadow">
              <Calendar className="h-10 w-10 text-gray-900 dark:text-white mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Voir le catalogue
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Parcourir les événements disponibles et réserver une place.
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                Voir les événements
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Link>

          <Link href="/mes-reservations">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414] hover:shadow-md transition-shadow">
              <Ticket className="h-10 w-10 text-gray-900 dark:text-white mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Mes réservations
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Consulter vos réservations et télécharger vos tickets.
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                Mes réservations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
