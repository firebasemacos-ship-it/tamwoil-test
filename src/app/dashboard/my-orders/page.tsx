'use client';

import { ArrowLeft, FileText, PackageCheck, PackageX, Truck, Building, Package, Plane, CheckCircle, Clock, MapPin, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';


const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ReactNode; className: string } } = {
    pending: { text: 'قيد التجهيز', icon: <Clock className="w-4 h-4" />, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    processed: { text: 'تم التنفيذ', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    ready: { text: 'تم التجهيز', icon: <Package className="w-4 h-4" />, className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    shipped: { text: 'تم الشحن', icon: <Truck className="w-4 h-4" />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
    arrived_dubai: { text: 'وصلت إلى دبي', icon: <Plane className="w-4 h-4" />, className: 'bg-orange-100 text-orange-700 border-orange-200' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: <Building className="w-4 h-4" />, className: 'bg-teal-100 text-teal-700 border-teal-200' },
    arrived_tobruk: { text: 'وصلت إلى طبرق', icon: <Building className="w-4 h-4" />, className: 'bg-purple-100 text-purple-700 border-purple-200' },
    out_for_delivery: { text: 'مع المندوب', icon: <MapPin className="w-4 h-4" />, className: 'bg-lime-100 text-lime-700 border-lime-200' },
    delivered: { text: 'تم التسليم', icon: <PackageCheck className="w-4 h-4" />, className: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { text: 'ملغي', icon: <PackageX className="w-4 h-4" />, className: 'bg-red-100 text-red-700 border-red-200' },
    paid: { text: 'مدفوع', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-green-100 text-green-700 border-green-200' },
};

const OrderCard = ({ order }: { order: Order }) => {
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "تم النسخ!",
                description: "تم نسخ كود التتبع إلى الحافظة.",
            });
        });
    };

    return (
        <Link href={`/dashboard/my-orders/${order.id}`} passHref>
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group">
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-white">#{order.invoiceNumber}</CardTitle>
                        <Badge variant="outline" className={`font-semibold text-xs py-1 px-2 gap-1.5 rounded-lg border-0 ${statusConfig[order.status].className}`}>
                            {statusConfig[order.status].icon}
                            {statusConfig[order.status].text}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="text-sm space-y-3 pt-3">
                    <div className="flex justify-between text-muted-foreground">
                        <span>تاريخ الطلب:</span>
                        <span className="font-medium text-foreground">{new Date(order.operationDate).toLocaleDateString('ar-LY')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="font-mono text-xs flex-grow text-slate-600 dark:text-slate-400 truncate ml-2">{order.trackingId}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.preventDefault(); copyToClipboard(order.trackingId); }}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">الدين المتبقي:</span>
                        <span className={order.remainingAmount > 0 ? 'text-blue-500 font-bold' : 'text-emerald-500 font-bold'}>
                            {order.remainingAmount.toFixed(2)} د.ل
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center rounded-b-xl border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-muted-foreground">القيمة الإجمالية</span>
                    <span className="text-base font-black text-slate-800 dark:text-white">{order.sellingPriceLYD.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">د.ل</span></span>
                </CardFooter>
            </Card>
        </Link>
    )
};

const MyOrdersPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserOrders = async () => {
            setIsLoading(true);
            try {
                const loggedInUserStr = localStorage.getItem('loggedInUser');
                if (!loggedInUserStr) {
                    router.push('/login');
                    return;
                }
                const loggedInUser = JSON.parse(loggedInUserStr);

                const allOrders = await getOrders();
                const userOrders = allOrders.filter(order => order.userId === loggedInUser.id);
                setOrders(userOrders.sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime()));

            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserOrders();
    }, [router]);

    const { totalAmount, totalRemainingDebt } = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (order.status !== 'cancelled') {
                acc.totalAmount += order.sellingPriceLYD;
                acc.totalRemainingDebt += order.remainingAmount;
            }
            return acc;
        }, { totalAmount: 0, totalRemainingDebt: 0 });
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') return orders;
        if (activeTab === 'pending') {
            return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        }
        return orders.filter(order => order.status === activeTab);
    }, [activeTab, orders]);

    const tabs = [
        { value: "all", label: "الكل" },
        { value: "pending", label: "الحالية" },
        { value: "delivered", label: "المسلمة" },
        { value: "cancelled", label: "الملغية" },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col font-sans text-foreground" dir="rtl">
            {/* Glass Header */}
            <header className="px-4 py-3 flex items-center gap-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">سجل الطلبات</h1>
            </header>

            <main className="flex-grow p-4 pb-28 space-y-4 max-w-lg mx-auto w-full">
                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                        {tabs.map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm font-medium transition-all"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <p>جاري تحميل الطلبات...</p>
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                                    <PackageX className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-1">لا توجد طلبات</h3>
                                <p className="text-sm text-muted-foreground">لم يتم العثور على أي طلبات في هذه القائمة.</p>
                            </div>
                        )}
                    </div>
                </Tabs>
            </main>

            <footer className="fixed bottom-[70px] left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 z-10">
                <div className="max-w-lg mx-auto space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الإجمالي الكلي:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{totalAmount.toFixed(2)} د.ل</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الدين المتبقي:</span>
                        <span className="font-bold text-blue-500">{totalRemainingDebt.toFixed(2)} د.ل</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MyOrdersPage;
