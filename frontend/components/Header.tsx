'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            Evenza
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                  {user.role === 'ADMIN' && (
                    <span className="px-2 py-1 text-xs bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded">
                      Admin
                    </span>
                  )}
                </div>
                {user.role === 'ADMIN' ? (
                  <>
                    <Button variant="ghost" className="hidden sm:flex" asChild>
                      <Link href="/admin/events">Événements</Link>
                    </Button>
                    <Button variant="ghost" className="hidden sm:flex" asChild>
                      <Link href="/admin/dashboard">Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="hidden sm:flex" asChild>
                      <Link href="/catalogue">Catalogue</Link>
                    </Button>
                    <Button variant="ghost" className="hidden sm:flex" asChild>
                      <Link href="/mes-reservations">Mes réservations</Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:flex text-gray-700 dark:text-gray-300" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" asChild>
                  <Link href="/register">Inscription</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
