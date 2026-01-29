
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Representative } from '@/lib/types';
import { getRepresentatives } from '@/lib/actions';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';
import { Home, Package, History, User } from 'lucide-react';

export default function RepresentativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [rep, setRep] = useState<Representative | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Force dark mode for this layout
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');

      const loggedInUserStr = localStorage.getItem('loggedInUser');
      if (loggedInUserStr) {
        try {
          const loggedInUser = JSON.parse(loggedInUserStr);
          if (loggedInUser.type === 'representative') {
            const allReps = await getRepresentatives();
            const currentRep = allReps.find(r => r.id === loggedInUser.id);
            if (currentRep) {
              setRep(currentRep);
            } else {
              router.push('/representative/login');
            }
          } else {
            router.push('/representative/login');
          }
        } catch (e) {
          router.push('/representative/login');
        }
      } else {
        router.push('/representative/login');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    document.documentElement.classList.remove('dark'); // Revert theme on logout
    router.push('/representative/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // ... component definition ...

  const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/representative/dashboard', exact: true },
    { label: 'المعلقة', icon: Package, href: '/representative/dashboard/pending' }, // Placeholder links, in real app might open sheets
    { label: 'السجل', icon: History, href: '/representative/dashboard/history' },
    { label: 'الملف', icon: User, href: '/representative/profile' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20" dir="rtl">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 p-4 sm:px-6 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">محفظة المندوبين</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="تسجيل الخروج" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      <div className="min-h-[calc(100vh-4rem)] p-4">
        {children}
      </div>

      {/* We actually need to handle the Bottom Nav logic. 
            Since the representative dashboard is a single page with sheets, 
            navigating to /representative/dashboard/whatever might be tricky if we don't have routes.
            For now, let's keep the nav visual, but maybe it should just control the view state if we refactored to context?
            
            However, the task is "UI/UX", so making it *look* like an app is key.
            Let's stick to simple routing or maybe just generic links for now. 
            Actually, let's make the dashboard the main view.
        */}
      <MobileBottomNav items={navItems} />
    </div>
  );
}
