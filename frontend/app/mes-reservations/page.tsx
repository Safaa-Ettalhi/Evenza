'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MesReservationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

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
          Mes réservations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Consultez vos réservations et téléchargez vos tickets (à venir).
        </p>
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          <Ticket className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aucune réservation pour le moment.
          </p>
          <Button asChild>
            <Link href="/">Voir les événements</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
