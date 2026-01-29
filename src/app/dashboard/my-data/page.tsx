'use client';

import { ArrowLeft, User as UserIcon, Phone, Hash, Calendar, DollarSign, AlertCircle, Loader2, LogOut, Moon, Sun, ChevronLeft, Bell, Globe, Shield, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getOrders, getUsers } from '@/lib/actions';
import { User, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming shadcn switch exists, or I'll implement a simple toggle if not
import { Separator } from '@/components/ui/separator';

const MyDataPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Theme init
        const storedTheme = localStorage.getItem('theme') || 'light';
        setTheme(storedTheme);

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
                    setOrders(allOrders.filter(o => o.userId === currentUser.id));
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        router.push('/login');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const totalAmount = useMemo(() => {
        return orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + o.sellingPriceLYD, 0);
    }, [orders]);

    const lastOrderDate = useMemo(() => {
        const userOrders = orders.filter(o => o.status !== 'cancelled');
        if (userOrders.length === 0) return 'لا يوجد';
        return new Date(Math.max(...userOrders.map(o => new Date(o.operationDate).getTime()))).toLocaleDateString('ar-LY');
    }, [orders]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#000] flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex flex-col font-sans text-foreground pb-24" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center gap-4 sticky top-0 z-20 bg-white/80 dark:bg-[#242526]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-500 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-[#e4e6eb]">الإعدادات</h1>
            </header>

            <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">

                {/* Profile Section */}
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-[#3a3b3c] flex items-center justify-center mb-3 shadow-sm border-4 border-white dark:border-[#242526]">
                        <UserIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-[#e4e6eb]">{user.name}</h2>
                    <p className="text-slate-500 dark:text-[#b0b3b8] text-sm font-medium">@{user.username}</p>
                </div>

                {/* Financial Group */}
                <SettingsGroup title="البيانات المالية">
                    <SettingsItem
                        icon={<DollarSign className="w-5 h-5 text-white" />}
                        iconBg="bg-emerald-500"
                        label="إجمالي التداولات"
                        value={`${totalAmount.toLocaleString()} د.ل`}
                    />
                    <SettingsItem
                        icon={<AlertCircle className="w-5 h-5 text-white" />}
                        iconBg="bg-blue-500"
                        label="الدين المستحق"
                        value={`${(user.debt || 0).toLocaleString()} د.ل`}
                        valueClassName="text-blue-500 font-bold"
                        isLast
                    />
                </SettingsGroup>

                {/* Account Group */}
                <SettingsGroup title="معلومات الحساب">
                    <SettingsItem
                        icon={<Phone className="w-5 h-5 text-white" />}
                        iconBg="bg-blue-500"
                        label="رقم الهاتف"
                        value={user.phone}
                    />
                    <SettingsItem
                        icon={<Hash className="w-5 h-5 text-white" />}
                        iconBg="bg-indigo-500"
                        label="رقم العميل"
                        value={`#${user.id.toString().padStart(4, '0')}`}
                    />
                    <SettingsItem
                        icon={<Calendar className="w-5 h-5 text-white" />}
                        iconBg="bg-orange-500"
                        label="آخر نشاط"
                        value={lastOrderDate}
                        isLast
                    />
                </SettingsGroup>

                {/* Preferences Group */}
                <SettingsGroup title="التفضيلات">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-[#303031] transition-colors cursor-pointer group" onClick={toggleTheme}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700' : 'bg-purple-500'}`}>
                                {theme === 'dark' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
                            </div>
                            <span className="text-[17px] font-medium text-slate-900 dark:text-[#e4e6eb]">المظهر الداكن</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 dark:text-[#b0b3b8]">{theme === 'dark' ? 'مفعل' : 'معطل'}</span>
                        </div>
                    </div>

                </SettingsGroup>

                {/* Support & Legal */}


                {/* Actions */}
                <div className="pt-2">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full bg-slate-200/50 dark:bg-[#242526] hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-500 font-bold h-12 rounded-xl text-lg"
                    >
                        تسجيل الخروج
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-4 mb-8">تمويل v1.0.0</p>
                </div>

            </main>
        </div>
    );
};

const SettingsGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h3 className="text-slate-500 dark:text-[#b0b3b8] text-sm font-semibold px-2">{title}</h3>
        <div className="bg-white dark:bg-[#242526] rounded-xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-none">
            {children}
        </div>
    </div>
);

interface SettingsItemProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value?: string;
    valueClassName?: string;
    hasChevron?: boolean;
    isLast?: boolean;
}

const SettingsItem = ({ icon, iconBg, label, value, valueClassName, hasChevron, isLast }: SettingsItemProps) => (
    <>
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-[#303031] transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <span className="text-[17px] font-medium text-slate-900 dark:text-[#e4e6eb]">{label}</span>
            </div>

            <div className="flex items-center gap-2">
                {value && <span className={`text-[15px] text-slate-500 dark:text-[#b0b3b8] ${valueClassName}`}>{value}</span>}
                {hasChevron && <ChevronLeft className="w-5 h-5 text-slate-300 dark:text-[#65676b]" />}
            </div>
        </div>
        {!isLast && <Separator className="bg-slate-100 dark:bg-[#3e4042] ml-14 w-auto" />}
    </>
);

export default MyDataPage;
