'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Event } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const availableSpots = event.availableSpots ?? event.capacity;
  const isFull = availableSpots === 0;
  const [isSoon, setIsSoon] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsSoon(new Date(event.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000);
    });
    return () => cancelAnimationFrame(timer);
  }, [event.date]);

  return (
    <Card className="group relative flex flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-[#141414]">
      {/* Badge "Bientôt" */}
      {isSoon && !isFull && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white shadow-lg dark:bg-white dark:text-gray-900">
          Bientôt
        </div>
      )}
      
      <CardHeader className="relative pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isFull
                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            }`}
          >
            {isFull ? 'Complet' : `${availableSpots} places`}
          </span>
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

        <div className="flex items-start gap-3 text-sm">
          <div className="mt-0.5 rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
            <Users className="h-4 w-4 text-gray-900 dark:text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">Participants</div>
            <div className="flex items-center gap-2">
              <div className="text-gray-600 dark:text-gray-400">
                {event.capacity - availableSpots} / {event.capacity}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-gray-900 transition-all duration-500 dark:bg-white"
                  style={{
                    width: `${((event.capacity - availableSpots) / event.capacity) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Link href={`/events/${event._id}`} className="w-full">
          <Button
            className="w-full group/btn bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            variant={isFull ? 'outline' : 'default'}
            disabled={isFull}
          >
            {isFull ? 'Complet' : 'Voir les détails'}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
