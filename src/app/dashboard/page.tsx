'use client';

import { Bell, Home, Search, Mail, Settings, DollarSign, FileText, Landmark, CreditCard, ClipboardList, Users, Sun, Moon, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import logo from '@/app/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Notification } from '@/lib/types';
import { getOrders, getUsers, getNotificationsForUser, markNotificationsAsReadForUser } from '@/lib/actions';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
// MobileBottomNav moved to layout.tsx



const DashboardPage = () => {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestOrderDate, setLatestOrderDate] = useState('...');
  const [totalValue, setTotalValue] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (!loggedInUserStr) {
          router.push('/login');
          return;
        }
        const loggedInUser = JSON.parse(loggedInUserStr);

        const allUsers = await getUsers();
        const currentUser = allUsers.find(u => u.id === loggedInUser.id);


        if (currentUser) {
          setUser(currentUser);

          const allOrders = await getOrders();
          const userOrders = allOrders.filter(o => o.userId === currentUser.id && o.status !== 'cancelled');

          if (userOrders.length > 0) {
            const latestDate = Math.max(...userOrders.map(o => new Date(o.operationDate).getTime()));
            setLatestOrderDate(new Date(latestDate).toLocaleDateString('ar-LY'));
          } else {
            setLatestOrderDate('لا يوجد');
          }

          const ordersTotal = userOrders.reduce((sum, o) => sum + o.sellingPriceLYD, 0);
          const debtTotal = userOrders.reduce((sum, o) => sum + o.remainingAmount, 0);
          setTotalValue(ordersTotal);
          setTotalDebt(debtTotal);
          setOrderCount(userOrders.length);

          // Fetch notifications
          const userNotifications = await getNotificationsForUser(currentUser.id);
          setNotifications(userNotifications);

        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleOpenNotifications = async () => {
    if (user && unreadNotificationsCount > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

      // Optimistically update UI
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));

      // Update in backend
      await markNotificationsAsReadForUser(unreadIds);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col space-y-8 max-w-lg mx-auto w-full">

      {/* Decorative Blob */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center sticky top-0 z-30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#1FA2D8] to-[#1885B8] rounded-xl shadow-lg shadow-blue-900/20">
            <Image
              src={logo}
              alt="Logo"
              width={24}
              height={24}
              className="brightness-0 invert"
            />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">تمويل</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          <DropdownMenu onOpenChange={(open) => { if (open) handleOpenNotifications(); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <Bell className="w-6 h-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 bg-blue-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? notifications.map(notification => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal py-3 cursor-pointer">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString('ar-LY')}</p>
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled>لا توجد إشعارات جديدة</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 space-y-8 pt-6 max-w-lg mx-auto w-full">
        {/* User Hero Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1FA2D8] to-[#1885B8] shadow-2xl shadow-blue-900/30 p-8 text-white min-h-[240px] flex flex-col justify-between group">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />

            {/* Card Content */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium mb-1 text-base">مساء الخير،</p>
                <h2 className="text-3xl font-black tracking-tight">{user?.name || '...'}</h2>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-2 gap-8">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">الرصيد الكلي</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-100">{totalValue.toLocaleString()} <span className="text-lg font-medium text-blue-200">د.ل</span></p>
                }
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">الدين الحالي</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  <p className="text-3xl font-bold text-white drop-shadow-sm">{totalDebt.toLocaleString()} <span className="text-lg font-medium text-blue-200">د.ل</span></p>
                }
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-blue-100 font-medium">
              <span>عدد الشحنات: {orderCount}</span>
              <span>آخر نشاط: {latestOrderDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-2">الوصول السريع</h3>
          <div className="grid grid-cols-3 gap-4">
            <ActionCard href="/dashboard/calculate-shipment" icon={<DollarSign className="w-6 h-6" />} label="حاسبة" delay={0.1} />
            <ActionCard href="/dashboard/track-shipment" icon={<Search className="w-6 h-6" />} label="تتبع" delay={0.2} />
            <ActionCard href="/dashboard/financial-operations" icon={<Landmark className="w-6 h-6" />} label="مالية" delay={0.3} />
            <ActionCard href="/dashboard/cards" icon={<CreditCard className="w-6 h-6" />} label="البطاقات" delay={0.35} />
            <ActionCard href="/dashboard/my-data" icon={<UserIcon className="w-6 h-6" />} label="بياناتي" delay={0.4} />
            <ActionCard href="/dashboard/my-orders" icon={<ClipboardList className="w-6 h-6" />} label="طلباتي" delay={0.5} />
            <ActionCard href="/dashboard/support-chat" icon={<Mail className="w-6 h-6" />} label="تواصل" delay={0.6} />
          </div>
        </div>

      </main>

      {/* Mobile Bottom Navigation handling moved to layout */}
    </div>
  );
};

const ActionCard = ({ icon, label, href, delay }: { icon: React.ReactElement; label: string; href: string; delay: number }) => (
  <Link href={href}>
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring" }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer aspect-square"
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-300">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
    </motion.div>
  </Link>
);

export default DashboardPage;
