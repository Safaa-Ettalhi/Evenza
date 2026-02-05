'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, List, BarChart3 } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Dashboard Admin
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Gérez vos événements et consultez les indicateurs.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/events">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414] hover:shadow-md transition-shadow">
            <Calendar className="h-10 w-10 text-gray-900 dark:text-white mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Gestion des événements
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Créer, modifier, publier ou annuler des événements.
            </p>
            <Button variant="outline" className="mt-4">
              Voir les événements
            </Button>
          </div>
        </Link>

        <Link href="/admin/reservations">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414] hover:shadow-md transition-shadow">
            <List className="h-10 w-10 text-gray-900 dark:text-white mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Réservations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Consulter et gérer toutes les réservations.
            </p>
            <Button variant="outline" className="mt-4">
              Voir les réservations
            </Button>
          </div>
        </Link>

        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414]">
          <BarChart3 className="h-10 w-10 text-gray-900 dark:text-white mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Indicateurs
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Taux de remplissage, événements à venir (à venir).
          </p>
        </div>
      </div>
    </div>
  );
}
