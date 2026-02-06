'use client';

import { useAuth } from '@/contexts/AuthContext';
import { apiService, Reservation, Event } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Ticket,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function AdminReservationsPage() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    async function fetchReservations() {
      if (!token || !isAuthenticated || user?.role !== 'ADMIN') return;

      try {
        setIsLoadingReservations(true);
        setError(null);
        const data = await apiService.getAllReservations(token);
        setReservations(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Impossible de charger les réservations');
      } finally {
        setIsLoadingReservations(false);
      }
    }

    if (isAuthenticated && token && user?.role === 'ADMIN') {
      fetchReservations();
    }
  }, [isAuthenticated, token, user]);

  const handleConfirm = async (id: string) => {
    if (!token) return;
    try {
      setProcessingId(id);
      setError(null);
      setSuccess(null);
      await apiService.confirmReservation(id, token);
      setSuccess('Réservation confirmée avec succès');
      const data = await apiService.getAllReservations(token);
      setReservations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la confirmation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (id: string) => {
    if (!token) return;
    if (!confirm('Êtes-vous sûr de vouloir refuser cette réservation ?')) return;
    try {
      setProcessingId(id);
      setError(null);
      setSuccess(null);
      await apiService.refuseReservation(id, token);
      setSuccess('Réservation refusée');
      const data = await apiService.getAllReservations(token);
      setReservations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du refus');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    try {
      setProcessingId(id);
      setError(null);
      setSuccess(null);
      await apiService.cancelReservation(id, token);
      setSuccess('Réservation annulée');
      const data = await apiService.getAllReservations(token);
      setReservations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setProcessingId(null);
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
        icon: XCircle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
      CANCELED: {
        label: 'Annulée',
        icon: Ban,
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

  const filteredReservations = filterStatus === 'ALL' 
    ? reservations 
    : reservations.filter(r => r.status === filterStatus);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des réservations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Consultez et gérez toutes les réservations.
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

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('ALL')}
          >
            Toutes
          </Button>
          <Button
            variant={filterStatus === 'PENDING' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('PENDING')}
          >
            En attente
          </Button>
          <Button
            variant={filterStatus === 'CONFIRMED' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('CONFIRMED')}
          >
            Confirmées
          </Button>
          <Button
            variant={filterStatus === 'REFUSED' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('REFUSED')}
          >
            Refusées
          </Button>
          <Button
            variant={filterStatus === 'CANCELED' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('CANCELED')}
          >
            Annulées
          </Button>
        </div>

        {isLoadingReservations ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <Ticket className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aucune réservation trouvée.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReservations.map((reservation) => {
              const event = getEventFromReservation(reservation);
              if (!event) return null;

              const eventDate = new Date(event.date);
              const reservationDate = reservation.createdAt ? new Date(reservation.createdAt) : null;
              const userEmail = typeof reservation.userId === 'object' && reservation.userId !== null && 'email' in reservation.userId
                ? (reservation.userId as { email?: string }).email ?? 'Utilisateur'
                : 'Utilisateur';

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
                        <User className="h-4 w-4 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Participant
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {userEmail}
                        </div>
                      </div>
                    </div>

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

                  <CardFooter className="pt-4">
                    <div className="flex gap-2 w-full flex-wrap">
                      {reservation.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConfirm(reservation._id)}
                            disabled={processingId === reservation._id}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
                          >
                            {processingId === reservation._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                Confirmation...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirmer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRefuse(reservation._id)}
                            disabled={processingId === reservation._id}
                            className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
                          >
                            {processingId === reservation._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                Refus...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Refuser
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(reservation._id)}
                          disabled={processingId === reservation._id}
                          className={`${reservation.status === 'PENDING' ? 'flex-1 min-w-[120px]' : 'w-full'} border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950`}
                        >
                          {processingId === reservation._id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-2" />
                              Annulation...
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Annuler
                            </>
                          )}
                        </Button>
                      )}
                    </div>
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
