'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Event } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Send, XCircle } from 'lucide-react';

const statusLabel: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELED: 'Annulé',
};

export default function AdminEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadEvents = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiService.getEventsAdmin(token);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePublish = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiService.publishEvent(id, token);
      await loadEvents();
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    if (!confirm('Annuler cet événement ?')) return;
    setActionId(id);
    try {
      await apiService.cancelEvent(id, token);
      await loadEvents();
    } finally {
      setActionId(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesStatus = filterStatus === 'ALL' || event.status === filterStatus;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const displayedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des événements
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez votre catalogue et le statut des événements.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 flex-wrap order-2 sm:order-1">
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('ALL')}
            className="rounded-full"
          >
            Tous
          </Button>
          <Button
            variant={filterStatus === 'DRAFT' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('DRAFT')}
            className="rounded-full"
          >
            Brouillons
          </Button>
          <Button
            variant={filterStatus === 'PUBLISHED' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('PUBLISHED')}
            className="rounded-full"
          >
            Publiés
          </Button>
          <Button
            variant={filterStatus === 'CANCELED' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('CANCELED')}
            className="rounded-full"
          >
            Annulés
          </Button>
        </div>

        <div className="w-full sm:w-72 order-1 sm:order-2">
          <Input
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-[#141414]"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 border rounded-lg border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun événement trouvé pour ce filtre.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {displayedEvents.map((event) => (
            <div
              key={event._id}
              className="group flex flex-col justify-between p-5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#141414] hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${event.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : event.status === 'CANCELED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                  >
                    {statusLabel[event.status || 'DRAFT']}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                    {event.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 flex items-center gap-1 mt-1">
                    <span className="inline-block w-20 truncate">{event.location}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" asChild className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2">
                  <Link href={`/admin/events/${event._id}/edit`} className="flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="text-xs">Éditer</span>
                  </Link>
                </Button>

                <div className="flex gap-2">
                  {event.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublish(event._id)}
                      disabled={actionId === event._id}
                      className="h-8 text-xs"
                    >
                      {actionId === event._id ? '...' : <><Send className="h-3 w-3 mr-1.5" /> Publier</>}
                    </Button>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(event._id)}
                      disabled={actionId === event._id}
                      className="h-8 text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/40"
                    >
                      {actionId === event._id ? '...' : <><XCircle className="h-3 w-3 mr-1.5" /> Annuler</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
