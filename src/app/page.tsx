'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dashboard } from '@/components/Dashboard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { LoginDialog } from '@/components/LoginDialog';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';

import { StatusIuranView } from '@/components/StatusIuranView';
import { JadwalLapanganView } from '@/components/JadwalLapanganView';
import { MemberManagement } from '@/components/MemberManagement';

type View = 'dashboard' | 'history' | 'status-iuran' | 'jadwal-lapangan' | 'anggota-akses';

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine initial view based on auth state (no direct setState in effect)
  // Allow dashboard to be the default view even if authenticated
  const displayView = currentView;

  // Update currentView when auth state changes - removed auto-switch logic to avoid complexity
  // Rely on user interaction

  const handleLoginClick = () => {
    setShowLoginDialog(true);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: View) => {
    // Only allow protected views if authenticated
    if ((view === 'history' || view === 'status-iuran' || view === 'jadwal-lapangan' || view === 'anggota-akses') && !isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    // Anggota & Akses is only for Pengurus
    if (view === 'anggota-akses' && user?.role !== 'pengurus') {
      return;
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Sistem Pencatatan Keuangan
                </h1>
                <p className="text-xs text-muted-foreground">Treasury Tennis Club Sulteng</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Button
                variant={displayView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={displayView === 'history' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('history')}
                disabled={!isAuthenticated}
              >
                Riwayat
              </Button>
              <Button
                variant={displayView === 'status-iuran' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('status-iuran')}
                disabled={!isAuthenticated}
              >
                Status Iuran
              </Button>
              <Button
                variant={displayView === 'jadwal-lapangan' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('jadwal-lapangan')}
                disabled={!isAuthenticated}
              >
                Jadwal
              </Button>
              {isAuthenticated && user?.role === 'pengurus' && (
                <Button
                  variant={displayView === 'anggota-akses' ? 'default' : 'ghost'}
                  onClick={() => handleViewChange('anggota-akses')}
                >
                  Anggota & Akses
                </Button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-muted-foreground">
                    {user?.name || user?.email}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {user?.role === 'pengurus' ? 'Pengurus' : 'Anggota'}
                  </span>
                  <Button variant="outline" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={handleLoginClick}>Login</Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2 border-t pt-4">
              <Button
                variant={displayView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('dashboard')}
                className="justify-start"
              >
                Dashboard
              </Button>
              <Button
                variant={displayView === 'history' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('history')}
                disabled={!isAuthenticated}
                className="justify-start"
              >
                Riwayat
              </Button>
              <Button
                variant={displayView === 'status-iuran' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('status-iuran')}
                disabled={!isAuthenticated}
                className="justify-start"
              >
                Status Iuran
              </Button>
              <Button
                variant={displayView === 'jadwal-lapangan' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('jadwal-lapangan')}
                disabled={!isAuthenticated}
                className="justify-start"
              >
                Jadwal Lapangan
              </Button>
              {isAuthenticated && user?.role === 'pengurus' && (
                <Button
                  variant={displayView === 'anggota-akses' ? 'default' : 'ghost'}
                  onClick={() => handleViewChange('anggota-akses')}
                  className="justify-start"
                >
                  Anggota & Akses
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user?.name || user?.email}
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {user?.role === 'pengurus' ? 'Pengurus' : 'Anggota'}
                    </span>
                  </div>
                  <Button variant="outline" onClick={handleLogout} className="justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={handleLoginClick} className="justify-start">
                  Login
                </Button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Memuat...</p>
            </div>
          </div>
        ) : (
          <>
            {displayView === 'dashboard' && <Dashboard onLoginClick={handleLoginClick} />}
            {displayView === 'history' && isAuthenticated && <TransactionHistory />}
            {displayView === 'status-iuran' && isAuthenticated && <StatusIuranView />}
            {displayView === 'jadwal-lapangan' && isAuthenticated && <JadwalLapanganView />}
            {displayView === 'anggota-akses' && isAuthenticated && user?.role === 'pengurus' && <MemberManagement />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Sistem Keuangan Treasury Tennis Club (TTC)
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TTC Sulteng.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}
