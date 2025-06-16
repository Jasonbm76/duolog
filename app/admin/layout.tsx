"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { FileText, Palette, Component, Home, Book, Mail, LogOut, User, Menu, X, TestTube, TrendingUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Simple auth check component
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for admin session
      const response = await fetch('/api/admin/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        // Redirect to login page unless already on login/verify pages
        if (!pathname.includes('/login') && !pathname.includes('/verify')) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // In development, allow access if API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Admin auth check failed, allowing access in development mode');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!pathname.includes('/login') && !pathname.includes('/verify')) {
          router.push('/admin/login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-on-dark">Checking authentication...</div>
      </div>
    );
  }

  // Allow access to login and verify pages without authentication
  if (!isAuthenticated && (pathname.includes('/login') || pathname.includes('/verify'))) {
    return <>{children}</>;
  }

  // Require authentication for all other admin pages
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-on-dark">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Set dynamic page title based on environment
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseTitle = 'DuoLog.ai - Admin';
    const title = isLocal ? `Local | ${baseTitle}` : baseTitle;
    
    // Use setTimeout to ensure we override the metadata title
    setTimeout(() => {
      console.log('Setting admin title:', title, { hostname: window.location.hostname, isLocal });
      document.title = title;
    }, 100);
  }, []);
  
  const navItems = [
    { href: "/admin", label: "Overview", icon: Home },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/components", label: "Components", icon: Component },
    { href: "/admin/docs", label: "Documentation", icon: FileText },
    { href: "/admin/email-preview", label: "Email Preview", icon: Mail },
    { href: "/admin/email-test", label: "Email Testing", icon: TestTube },
    { href: "/admin/playground", label: "Playground", icon: Book },
    { href: "/admin/style-guide", label: "Style Guide", icon: Palette },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/');
      } else {
        toast.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-background">
        {/* Admin Navigation */}
        <div className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.svg"
                alt="DuoLog.ai"
                width={120}
                height={32}
                style={{ height: '32px', width: '120px' }}
              />
              <span className="text-on-dark-muted text-sm font-medium">
                Admin
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              <nav className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Admin User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-neutral-800 border-neutral-700">
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="text-neutral-300 hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 focus:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden flex items-center gap-3">
              {/* Admin User Menu (Mobile) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-neutral-800 border-neutral-700">
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="text-neutral-300 hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 focus:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hamburger Menu Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-700"
          >
            <div className="max-w-7xl mx-auto px-6 py-4">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}