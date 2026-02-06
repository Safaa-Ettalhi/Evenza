'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiService, Event } from '@/lib/api';
import Link from 'next/link';

interface EventActionsProps {
  event: Event;
}

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableSpots = event.availableSpots ?? event.capacity;
  const isFull = availableSpots === 0;
  const isPublished = event.status === 'PUBLISHED';
  const canReserve = isAuthenticated && isPublished && !isFull && user?.role === 'PARTICIPANT';

  const handleReserve = async () => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    try {
      setIsReserving(true);
      setError(null);
      setSuccess(null);

      await apiService.createReservation(
        { eventId: typeof event._id === 'string' ? event._id : String(event._id) },
        token
      );

      setSuccess('Votre réservation a été créée avec succès ! Elle est en attente de confirmation.');
      router.refresh(); 
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la réservation');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

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
  );
}
