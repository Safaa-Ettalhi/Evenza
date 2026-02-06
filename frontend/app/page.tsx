import { Header } from '@/components/Header';
import { PublicHomePage } from '@/components/PublicHomePage';
import { DashboardContent } from '@/components/DashboardContent';
import { Event, API_URL } from '@/lib/api';
import { AuthWrapper } from '@/components/AuthWrapper';

export const dynamic = 'force-dynamic';

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/events`, {
      cache: 'no-store', 
    });

    if (!res.ok) {
      console.error('Failed to fetch events:', res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      <AuthWrapper
        publicContent={<PublicHomePage events={events} />}
        authenticatedContent={<DashboardContent />}
      />
    </div>
  );
}
