'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, Menu, X } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    if (path === '/admin/events') {
      return pathname.startsWith('/admin/events');
    }
    if (path === '/admin/reservations') {
      return pathname === '/admin/reservations';
    }
    if (path === '/catalogue') {
      return pathname === '/catalogue';
    }
    if (path === '/mes-reservations') {
      return pathname === '/mes-reservations';
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            Evenza
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                  {user.role === 'ADMIN' && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                      <Shield className="h-3 w-3" />
                    </div>
                  )}
                </div>
                {user.role === 'ADMIN' ? (
                  <>
                    <Button 
                      variant={isActive('/admin/events') ? 'default' : 'ghost'} 
                      className={isActive('/admin/events') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                      asChild
                    >
                      <Link href="/admin/events">Événements</Link>
                    </Button>
                    <Button 
                      variant={isActive('/admin/reservations') ? 'default' : 'ghost'} 
                      className={isActive('/admin/reservations') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                      asChild
                    >
                      <Link href="/admin/reservations">Réservations</Link>
                    </Button>
                    <Button 
                      variant={isActive('/admin/dashboard') ? 'default' : 'ghost'} 
                      className={isActive('/admin/dashboard') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                      asChild
                    >
                      <Link href="/admin/dashboard">Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant={isActive('/catalogue') ? 'default' : 'ghost'} 
                      className={isActive('/catalogue') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                      asChild
                    >
                      <Link href="/catalogue">Catalogue</Link>
                    </Button>
                    <Button 
                      variant={isActive('/mes-reservations') ? 'default' : 'ghost'} 
                      className={isActive('/mes-reservations') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                      asChild
                    >
                      <Link href="/mes-reservations">Mes réservations</Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Déconnexion</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" asChild>
                  <Link href="/register">Inscription</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            {isAuthenticated && user && (
              <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mr-2">
                {user.role === 'ADMIN' && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                    <Shield className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="sm:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <User className="h-4 w-4" />
                  <span className="text-xs">{user.email}</span>
                </div>
                {user.role === 'ADMIN' ? (
                  <>
                    <Button 
                      variant={isActive('/admin/events') ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${isActive('/admin/events') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/admin/events">Événements</Link>
                    </Button>
                    <Button 
                      variant={isActive('/admin/reservations') ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${isActive('/admin/reservations') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/admin/reservations">Réservations</Link>
                    </Button>
                    <Button 
                      variant={isActive('/admin/dashboard') ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${isActive('/admin/dashboard') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/admin/dashboard">Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant={isActive('/catalogue') ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${isActive('/catalogue') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/catalogue">Catalogue</Link>
                    </Button>
                    <Button 
                      variant={isActive('/mes-reservations') ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${isActive('/mes-reservations') ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/mes-reservations">Mes réservations</Link>
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full justify-start mt-2 border-t border-gray-200 dark:border-gray-800 pt-3"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button className="w-full justify-start bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/register">Inscription</Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
