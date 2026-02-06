'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { PublicHomePage } from '@/components/PublicHomePage';
import { DashboardContent } from '@/components/DashboardContent';
import { Event, API_URL } from '@/lib/api';
import { useEffect, useState } from 'react';

const FETCH_TIMEOUT_MS = 2000;

async function getEvents(): Promise<Event[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${API_URL}/events`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      getEvents().then(setEvents).finally(() => setEventsLoading(false));
    } else {
      queueMicrotask(() => setEventsLoading(false));
    }
  }, [isAuthenticated]);

  if (isLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      {isAuthenticated && user ? (
        <DashboardContent />
      ) : (
        <PublicHomePage events={events} />
      )}
    </div>
  );
}
