'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Home,
  Users,
  Briefcase,
  Bike,
  ShoppingCart,
  Users2,
  BarChart,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Loader2,
  DollarSign,
  TrendingDown,
  HandCoins,
  Printer,
  Download,
  BookUser,
  Zap,
  Package,
  CreditCard,
  FileText,
  UserCheck,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import logo from '@/app/assets/logo.png';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Manager } from '@/lib/types';
import { getManagerById } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/admin/dashboard', icon: Home, label: 'لوحة التحكم', permissionId: 'dashboard' },
  { href: '/admin/users', icon: Users, label: 'إدارة المستخدمين', permissionId: 'users' },
  { href: '/admin/employees', icon: Briefcase, label: 'إدارة المدراء', permissionId: 'employees' },
  { href: '/admin/representatives', icon: Bike, label: 'إدارة المندوبين', permissionId: 'representatives' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'إدارة الطلبات', permissionId: 'orders' },
  { href: '/admin/cards', icon: CreditCard, label: 'إدارة البطاقات', permissionId: 'cards' },
  { href: '/admin/shipping-label', icon: Printer, label: 'بوالص الشحن', permissionId: 'shipping_label' },
  { href: '/admin/temporary-users', icon: Users2, label: 'المستخدمين المؤقتين', permissionId: 'temporary_users' },
  { href: '/admin/financial-reports', icon: BarChart, label: 'التقارير المالية', permissionId: 'financial_reports' },
  { href: '/admin/instant-sales', icon: Zap, label: 'مبيعات فورية', permissionId: 'instant_sales' },
  { href: '/admin/deposits', icon: HandCoins, label: 'سجل العربون', permissionId: 'deposits' },
  { href: '/admin/expenses', icon: TrendingDown, label: 'إدارة المصروفات', permissionId: 'expenses' },
  { href: '/admin/creditors', icon: BookUser, label: 'إدارة الذمم', permissionId: 'creditors' },
  { href: '/admin/support-center', icon: MessageSquare, label: 'مركز الدعم', permissionId: 'support' },
  { href: '/admin/notifications', icon: Bell, label: 'إدارة الإشعارات', permissionId: 'notifications' },
  { href: '/admin/data-export', icon: Download, label: 'تصدير البيانات', permissionId: 'data_export' },
  { href: '/admin/exchange-rate', icon: DollarSign, label: 'اسعار الصرف والشحن', permissionId: 'exchange_rate' },
  { href: '/admin/settings', icon: Settings, label: 'إعدادات التطبيق', permissionId: 'dashboard' },
];

const getPageTitle = (pathname: string): string => {
  const pageTitles: { [key: string]: string } = {
    '/admin/dashboard': 'لوحة التحكم الرئيسية',
    '/admin/users': 'إدارة المستخدمين',
    '/admin/employees': 'إدارة المدراء',
    '/admin/representatives': 'إدارة المندوبين',
    '/admin/orders': 'إدارة الطلبات',
    '/admin/orders/add': 'إضافة/تعديل طلب',
    '/admin/shipping-label': 'إنشاء بوليصة شحن يدوية',
    '/admin/shipping-label/history': 'سجل البوليصات اليدوية',
    '/admin/temporary-users': 'إدارة المستخدمين المؤقتين',
    '/admin/temporary-users/add': 'إضافة فاتورة مجمعة',
    '/admin/financial-reports': 'التقارير المالية',
    '/admin/instant-sales': 'حاسبة المبيعات الفورية',
    '/admin/instant-sales/history': 'سجل المبيعات الفورية',
    '/admin/deposits': 'سجل العربون',
    '/admin/expenses': 'إدارة المصروفات',
    '/admin/creditors': 'إدارة الذمم (الدائنون/المدينون)',
    '/admin/support-center': 'مركز الدعم',
    '/admin/notifications': 'إدارة الإشعارات',
    '/admin/data-export': 'تصدير البيانات',
    '/admin/exchange-rate': 'اسعار الصرف والشحن',
    '/admin/settings': 'إعدادات التطبيق',
  };

  if (pathname.startsWith('/admin/users/print')) return 'طباعة كشف حساب المستخدم';
  if (pathname.startsWith('/admin/users/')) return 'الملف الشخصي للمستخدم';
  if (pathname.startsWith('/admin/representatives/')) return 'الملف الشخصي للمندوب';
  if (pathname.startsWith('/admin/creditors/print')) return 'طباعة كشف حساب';
  if (pathname.startsWith('/admin/creditors/')) return 'ملف الذمة';
  if (pathname.startsWith('/admin/orders/')) return 'تفاصيل الطلب';

  return pageTitles[pathname] || 'لوحة التحكم';
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.type === 'admin') {
          const fetchManagerData = async () => {
            const manager = await getManagerById(userData.id);
            if (manager) {
              setCurrentManager(manager);
              setIsAuthenticated(true);
            } else {
              handleLogout();
            }
          };
          fetchManagerData();
        } else {
          setIsAuthenticated(false);
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
        }
      } catch (e) {
        setIsAuthenticated(false);
        if (pathname !== '/admin/login') router.push('/admin/login');
      }
    } else {
      setIsAuthenticated(false);
      if (pathname !== '/admin/login') router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentManager(null);
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const currentPageTitle = getPageTitle(pathname);

  const visibleNavItems = navItems.filter(item => {
    if (item.permissionId === 'dashboard') return true;
    const isSuperAdmin = currentManager?.username === 'admin@tamweelsys.app';
    if (isSuperAdmin) return true;
    return currentManager?.permissions?.includes(item.permissionId);
  });

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/admin/login' || !isAuthenticated) {
    return <>{children}</>;
  }

  if (pathname !== '/admin/dashboard' && !visibleNavItems.some(item => pathname.startsWith(item.href))) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))] text-center p-4" dir="rtl">
        <div className="glass-card p-8 rounded-2xl border-red-500/20">
          <h1 className="text-3xl font-bold text-destructive mb-4">وصول مرفوض</h1>
          <p className="text-muted-foreground mb-6">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>العودة إلى لوحة التحكم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-foreground font-sans selection:bg-blue-500/30" dir="rtl">

      <TooltipProvider>
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* redesigned DARK Sidebar */}
        <aside
          className={cn(
            'fixed top-0 right-0 bottom-0 z-40 w-72 transition-transform duration-300 ease-in-out no-print',
            'bg-[#1e1b4b] dark:bg-slate-900 border-l border-white/5 flex flex-col', // Dark Theme Sidebar (Navy/Slate)
            isSidebarOpen ? 'translate-x-0' : 'translate-x-[100%]',
            'md:translate-x-0'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 p-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA2D8] to-[#1885B8] flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Image src={logo} alt="Logo" width={24} height={24} className="brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">تمويل</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400 hover:text-white mr-auto"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <ul className="space-y-1.5">
              {visibleNavItems.map((item) => {
                const isActive = (pathname.startsWith(item.href) && item.href !== '/admin/dashboard') || pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 group relative overflow-hidden',
                        isActive
                          ? 'bg-[#1FA2D8] text-white shadow-md shadow-blue-900/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 z-10 relative transition-transform duration-200",

                      )}
                      />
                      <span className="z-10 relative text-sm">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Profile at Bottom */}
          <div className="p-6 mt-auto">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/10">
                {currentManager?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-blue-200 transition-colors">{currentManager?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400 truncate">مدير النظام</p>
              </div>
              <LogOut onClick={handleLogout} className="w-5 h-5 text-slate-500 hover:text-blue-400 transition-colors" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="md:pr-[18rem] transition-[padding] duration-300 min-h-screen">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 px-6 md:px-8 no-print bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white">{currentPageTitle}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground">
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>تغيير المظهر</p></TooltipContent>
              </Tooltip>
            </div>

          </header>

          <main className="p-4 sm:p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </TooltipProvider>
    </div>
  );
}
