'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Briefcase,
    Bike,
    ShoppingCart,
    Users2,
    BarChart,
    MessageSquare,
    Bell,
    ArrowRight,
    Loader2,
    MoreHorizontal,
    TrendingUp,
    TrendingDown,
    Zap,
    Search,
    Maximize2,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Manager, Order } from '@/lib/types';
import { getManagerById, getTransactions, getExpenses, getOrders } from '@/lib/actions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumDonutChart } from '@/components/ui/PremiumDonutChart';


const allDashboardItems = [
    { title: "الطلبات", href: "/admin/orders", icon: ShoppingCart },
    { title: "المستخدمين", href: "/admin/users", icon: Users },
    { title: "المندوبين", href: "/admin/representatives", icon: Bike },
    { title: "التقارير", href: "/admin/financial-reports", icon: BarChart },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
};

const AdminDashboardPage = () => {
    const [manager, setManager] = useState<Manager | null>(null);
    const [dailyData, setDailyData] = useState({ revenue: 0, expenses: 0, netProfit: 0, totalOrders: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isDailyDataLoading, setIsDailyDataLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const user = localStorage.getItem('loggedInUser');
            if (!user) return;

            try {
                const userData = JSON.parse(user);
                if (userData.type === 'admin') {
                    const fetchedManager = await getManagerById(userData.id);
                    setManager(fetchedManager);
                }

                setIsDailyDataLoading(true);
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                const [transactions, expenses, orders] = await Promise.all([
                    getTransactions(),
                    getExpenses(),
                    getOrders(),
                ]);

                const regularTransactions = transactions.filter(t => !t.customerId.startsWith('TEMP-'));

                // Sort Recent Orders
                const sortedOrders = [...orders]
                    .sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
                    .slice(0, 4);
                setRecentOrders(sortedOrders);

                // Daily Calcs
                const todayRevenue = regularTransactions
                    .filter(t => t.date.startsWith(todayStr) && t.type === 'payment')
                    .reduce((sum, t) => sum + t.amount, 0);

                const todayExpenses = expenses
                    .filter(e => e.date.startsWith(todayStr))
                    .reduce((sum, e) => sum + e.amount, 0);

                const todayOrdersDocs = orders.filter(o => o.operationDate.startsWith(todayStr));

                // Demo logic for Net Profit (Simplified)
                const todayNetProfit = todayRevenue - todayExpenses;

                setDailyData({
                    revenue: todayRevenue,
                    expenses: todayExpenses,
                    netProfit: todayNetProfit,
                    totalOrders: todayOrdersDocs.length
                });

                // Chart Data (Last 7 Days)
                const days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dStr = d.toISOString().split('T')[0];
                    const dayName = format(d, 'EEE', { locale: ar });

                    const dayRev = regularTransactions
                        .filter(t => t.date.startsWith(dStr) && t.type === 'payment')
                        .reduce((s, t) => s + t.amount, 0);

                    const dayOrders = orders.filter(o => o.operationDate.startsWith(dStr)).length;

                    days.push({
                        name: dayName,
                        revenue: dayRev,
                        orders: dayOrders
                    });
                }
                setChartData(days);
                setIsDailyDataLoading(false);

            } catch (e) {
                console.error("Dashboard data load failed", e);
                setIsDailyDataLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-10"
        >
            {/* Header / Search Bar Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">لوحة القيادة</h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        {/* Fake Search for UI matching */}
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            placeholder="بحث..."
                            className="w-full h-10 pr-10 pl-4 rounded-full bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <Link href="/admin/orders/add">
                        <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 font-medium px-6">
                            طلب جديد
                        </Button>
                    </Link>
                    <div className="flex gap-2 text-muted-foreground">
                        <Maximize2 className="w-5 h-5 cursor-pointer hover:text-foreground transition-colors" />
                        <Bell className="w-5 h-5 cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                </div>
            </div>

            {/* Top Row: Hero Card & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Hero Card - Revenue (Crimson Gradient) */}
                <div className="md:col-span-5 lg:col-span-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1FA2D8] to-[#1885B8] rounded-[2rem] transform rotate-1 group-hover:rotate-2 transition-transform duration-500 opacity-50 blur-lg" />
                    <div className="relative h-full bg-gradient-to-br from-[#1FA2D8] to-[#1885B8] rounded-[2rem] p-8 text-white flex flex-col justify-between overflow-hidden shadow-2xl shadow-blue-900/20">
                        {/* Decorative Wave */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none">
                            <svg viewBox="0 0 1440 320" className="w-full h-full">
                                <path fill="#fff" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,144C672,128,768,128,864,149.3C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"></path>
                            </svg>
                        </div>

                        <div className="flex justify-between items-start">
                            <span className="font-medium text-blue-100">الإيرادات اليومية</span>
                            <MoreHorizontal className="w-6 h-6 text-blue-200 cursor-pointer hover:text-white" />
                        </div>

                        <div className="mt-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                                {isDailyDataLoading ? "..." : dailyData.revenue.toLocaleString()}
                                <span className="text-2xl opacity-80 font-normal mr-2">د.ل</span>
                            </h2>
                        </div>

                        <div className="mt-8 flex gap-8">
                            <div>
                                <span className="block text-blue-200 text-sm mb-1">صافي الربح</span>
                                <span className="font-bold text-xl">{isDailyDataLoading ? "..." : "%" + ((dailyData.revenue > 0 ? (dailyData.netProfit / dailyData.revenue) * 100 : 0).toFixed(1))}</span>
                            </div>
                            <div>
                                <span className="block text-blue-200 text-sm mb-1">المصاريف</span>
                                <span className="font-bold text-xl">{(dailyData.expenses / 1000).toFixed(1)}k</span>
                            </div>
                            <div>
                                <span className="block text-blue-200 text-sm mb-1">الطلبات</span>
                                <span className="font-bold text-xl">{dailyData.totalOrders}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donut Chart / Stats Panel */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="h-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">توزيع المصاريف</h3>
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h4 className="text-3xl font-bold mb-4">
                            {isDailyDataLoading ? "..." : dailyData.expenses.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">د.ل</span>
                        </h4>

                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Reusing Premium Donut or Simple Ring */}
                            <div className="scale-75 origin-center">
                                <PremiumDonutChart
                                    data={[
                                        { name: "أرباح", value: dailyData.netProfit > 0 ? dailyData.netProfit : 1, color: "#1FA2D8" },
                                        { name: "تكاليف", value: dailyData.revenue - dailyData.netProfit, color: "#7DD3FC" },
                                    ]}
                                    innerRadius={70}
                                    outerRadius={100}
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <PlusIcon />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#1FA2D8]" />
                                <span>أرباح</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#7DD3FC]" />
                                <span>تكاليف</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Small Stats Column */}
                <div className="md:col-span-3 lg:col-span-5 flex flex-col gap-6">
                    {/* Stat CARD 1 - Support Center */}
                    <Link href="/admin/support-center">
                        <div className="bg-[#fdf2f2] dark:bg-slate-800/50 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">الدعم</h3>
                                <span className="text-muted-foreground font-medium">مركز الدعم</span>
                            </div>
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </Link>
                    {/* Stat CARD 2 */}
                    <Link href="/admin/orders">
                        <div className="bg-white dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg">إدارة الطلبات</h3>
                                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="h-24 flex items-end justify-between gap-2">
                                <div className="h-24 flex items-end justify-between gap-2">
                                    {chartData.length > 0 ? (
                                        chartData.map((day, i) => {
                                            // Calculate height relative to max orders, defaulting to 10% if 0
                                            const maxOrders = Math.max(...chartData.map(d => d.orders), 1);
                                            const heightPercentage = Math.max((day.orders / maxOrders) * 100, 10);

                                            return (
                                                <div key={i} className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-sm h-full flex items-end relative group/bar">
                                                    <div
                                                        style={{ height: `${heightPercentage}%` }}
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${i === chartData.length - 1 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    />
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        {day.orders} طلب
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                            جاري التحميل...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Bottom Row: List & Main Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className="font-bold text-lg border-b-2 border-slate-900 dark:border-white pb-4 -mb-4.5 px-2">أحدث الطلبات</h3>
                        <h3 className="font-medium text-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors">المستخدمين</h3>
                    </div>

                    <div className="space-y-6">
                        {recentOrders.map(order => (
                            <Link key={order.id} href={`/admin/orders/${order.id}`}>
                                <div className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {order.status === 'delivered' ? <span className="text-xl">📦</span> : <span className="text-xl">📄</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{order.customerName || 'عميل غير مسجل'}</h4>
                                            <p className="text-sm text-muted-foreground">فاتورة #{order.invoiceNumber}</p>
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {order.store || 'المخزن العام'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-left">
                                            <span className="block font-bold">{order.sellingPriceLYD.toLocaleString()} د.ل</span>
                                            {order.status === 'delivered' ?
                                                <span className="text-xs text-emerald-500 flex items-center gap-1"><ArrowRight className="w-3 h-3 rotate-45" /> مكتمل</span>
                                                :
                                                <span className="text-xs text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3" /> قيد المعالجة</span>
                                            }
                                        </div>
                                        <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {recentOrders.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">لا توجد طلبات حديثة</div>
                        )}
                    </div>
                </div>

                {/* Vertical Stats Column (Right Side) */}
                <div className="space-y-6">
                    {/* Completed Posts / Orders Stat */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold">{dailyData.totalOrders}</span>
                        </div>
                        <h4 className="font-bold mb-1">الطلبات المكتملة</h4>
                        <p className="text-sm text-muted-foreground">هذا الأسبوع</p>
                    </div>

                    {/* Financial Reports Link */}
                    <Link href="/admin/financial-reports">
                        <div className="bg-[#f0f9ff] dark:bg-blue-900/10 rounded-[2rem] p-6 flex flex-col justify-between h-40 cursor-pointer hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">التقارير المالية</h3>
                                    <p className="text-sm text-muted-foreground font-medium">عرض التفاصيل</p>
                                </div>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <BarChart className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-auto">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-3/4" />
                            </div>
                        </div>
                    </Link>
                </div>

            </div>
        </motion.div>
    );
};

// Simple Plus Icon SVG
const PlusIcon = () => (
    <div className="bg-white shadow-sm p-2 rounded-full transform rotate-45">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1FA2D8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    </div>
)

export default AdminDashboardPage;
