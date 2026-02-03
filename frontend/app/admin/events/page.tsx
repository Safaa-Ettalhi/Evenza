'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Event } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

  const loadEvents = async () => {
    if (!token) return;
    try {
      const data = await apiService.getEventsAdmin(token);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestion des événements
        </h1>
        <Button asChild>
          <Link href="/admin/events/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Aucun événement. Créez-en un pour commencer.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414]"
            >
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {event.location} • {new Date(event.date).toLocaleDateString('fr-FR')}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${
                    event.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : event.status === 'CANCELED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {statusLabel[event.status || 'DRAFT']}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/events/${event._id}/edit`} className="flex items-center gap-1">
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
                {event.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    onClick={() => handlePublish(event._id)}
                    disabled={actionId === event._id}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Publier
                  </Button>
                )}
                {event.status === 'PUBLISHED' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(event._id)}
                    disabled={actionId === event._id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
