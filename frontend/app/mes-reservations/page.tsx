'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiService, Reservation, Event } from '@/lib/api';
import { Ticket, Calendar, MapPin, X, AlertCircle, CheckCircle2, Clock, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function MesReservationsPage() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function fetchReservations() {
      if (!token || !isAuthenticated) {
        setError('Vous devez être connecté pour voir vos réservations');
        setIsLoadingReservations(false);
        return;
      }
      if (!token.trim()) {
        setError('Token d\'authentification invalide. Veuillez vous reconnecter.');
        setIsLoadingReservations(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      try {
        setIsLoadingReservations(true);
        setError(null);
        const data = await apiService.getMyReservations(token);
        setReservations(data);
      } catch (err: any) {
        const errorMessage = err.message || 'Impossible de charger vos réservations';
        setError(errorMessage);
        
        if (errorMessage.toLowerCase().includes('unauthorized') || 
            errorMessage.toLowerCase().includes('non autorisé') ||
            errorMessage.toLowerCase().includes('token')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } finally {
        setIsLoadingReservations(false);
      }
    }

    if (isAuthenticated && token) {
      fetchReservations();
    }
  }, [isAuthenticated, token, router]);

  const handleCancel = async (reservationId: string) => {
    if (!token) return;

    try {
      setCancelingId(reservationId);
      setError(null);
      setSuccess(null);

      await apiService.cancelReservation(reservationId, token);
      
      setSuccess('Votre réservation a été annulée avec succès.');
      setConfirmCancelId(null);
      
      const data = await apiService.getMyReservations(token);
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'annulation');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: 'En attente',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      },
      CONFIRMED: {
        label: 'Confirmée',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      },
      REFUSED: {
        label: 'Refusée',
        icon: Ban,
        className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
      CANCELED: {
        label: 'Annulée',
        icon: X,
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getEventFromReservation = (reservation: Reservation): Event | null => {
    if (typeof reservation.eventId === 'object' && reservation.eventId !== null) {
      return reservation.eventId as Event;
    }
    return null;
  };

  const canCancel = (status: string) => {
    return status === 'PENDING' || status === 'CONFIRMED';
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
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
          Consultez vos réservations et gérez-les.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingReservations ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <Ticket className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aucune réservation pour le moment.
            </p>
            <Button asChild>
              <Link href="/">Voir les événements</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map((reservation) => {
              const event = getEventFromReservation(reservation);
              if (!event) return null;

              const eventDate = new Date(event.date);
              const reservationDate = reservation.createdAt ? new Date(reservation.createdAt) : null;

              return (
                <Card
                  key={reservation._id}
                  className="group relative flex flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-[#141414]"
                >
                  <CardHeader className="relative pb-4">
                    <div className="mb-3 flex items-center justify-between">
                      {getStatusBadge(reservation.status)}
                    </div>
                    <CardTitle className="mb-2 line-clamp-2 text-xl font-bold text-gray-900 dark:text-white">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {event.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                        <Calendar className="h-4 w-4 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {eventDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {eventDate.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                        <MapPin className="h-4 w-4 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Lieu</div>
                        <div className="line-clamp-1 text-gray-600 dark:text-gray-400">
                          {event.location}
                        </div>
                      </div>
                    </div>

                    {reservationDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Réservée le {reservationDate.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} à {reservationDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 flex gap-2">
                    <Link href={`/events/${event._id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        Voir les détails
                      </Button>
                    </Link>
                    {canCancel(reservation.status) && (
                      <>
                        {confirmCancelId === reservation._id ? (
                          <div className="flex gap-2 flex-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(reservation._id)}
                              disabled={cancelingId === reservation._id}
                            >
                              {cancelingId === reservation._id ? 'Annulation...' : 'Confirmer'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmCancelId(null)}
                              disabled={cancelingId === reservation._id}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmCancelId(reservation._id)}
                            disabled={cancelingId === reservation._id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
