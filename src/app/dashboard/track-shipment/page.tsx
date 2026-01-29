'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Loader2, PackageCheck, Truck, XCircle, MapPin, Weight, DollarSign, Tag, Building, Plane, CheckCircle, Clock, History, Package } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { getOrderByTrackingId } from "@/lib/actions";
import { Order, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

// --- Simplified 4-Step Configuration ---
const VISUAL_STEPS = [
    { id: 'step_processing', label: 'قيد التجهيز', icon: <Clock className="w-6 h-6" /> },
    { id: 'step_executing', label: 'قيد التنفيذ', icon: <Package className="w-6 h-6" /> },
    { id: 'step_arrived', label: 'وصلت للمدينة', icon: <Building className="w-6 h-6" /> }, // Dynamic Label
    { id: 'step_delivered', label: 'تم التسليم', icon: <PackageCheck className="w-6 h-6" /> }
];

const TrackShipmentPage = () => {
    const router = useRouter();
    const [trackingId, setTrackingId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('recentTrackingSearches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    const addToHistory = (id: string) => {
        const newHistory = [id, ...recentSearches.filter(item => item !== id)].slice(0, 5);
        setRecentSearches(newHistory);
        localStorage.setItem('recentTrackingSearches', JSON.stringify(newHistory));
    };

    const handleSearch = async (queryId = trackingId) => {
        if (!queryId) return;
        setIsLoading(true);
        setError(null);
        setOrder(null);
        setTrackingId(queryId);

        try {
            const result = await getOrderByTrackingId(queryId.toUpperCase());
            if (result) {
                setOrder(result);
                addToHistory(queryId.toUpperCase());
            } else {
                setError("لم يتم العثور على شحنة بهذا الكود.");
            }
        } catch (e) {
            setError("حدث خطأ أثناء البحث.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to map DB status to the 4 visual steps (0 to 3)
    // Returns the index of the *current* active step (or last completed step)
    const getCurrentStepIndex = (status: OrderStatus): number => {
        switch (status) {
            case 'pending': return 0; // Processing
            case 'processed':
            case 'ready':
            case 'shipped': return 1; // Executing
            case 'arrived_dubai':
            case 'arrived_benghazi':
            case 'arrived_tobruk': return 2; // Arrived City
            case 'out_for_delivery':
            case 'delivered':
            case 'paid': return 3; // Delivered
            case 'cancelled': return -1;
            default: return 0;
        }
    };

    // Helper to get dynamic label for Step 3 (Arrived)
    const getArrivedLabel = (status: OrderStatus) => {
        if (status === 'arrived_dubai') return 'وصلت دبي';
        if (status === 'arrived_benghazi') return 'وصلت بنغازي';
        if (status === 'arrived_tobruk') return 'وصلت طبرق';

        // If passed this stage (e.g. delivered), show the last known city or generic
        if (['out_for_delivery', 'delivered', 'paid'].includes(status)) return 'وصلت طبرق'; // Assuming Tobruk is final hub

        return 'نقطة الوصول';
    };

    // Helper to get color state for a step
    const getStepState = (stepIndex: number, currentStepIndex: number) => {
        if (currentStepIndex === -1) return 'cancelled'; // Special case
        if (stepIndex < currentStepIndex) return 'completed';
        if (stepIndex === currentStepIndex) return 'current';
        return 'upcoming';
    };

    // Helper to get status description text based on 4 statuses
    const getStatusDescription = (status: OrderStatus) => {
        const idx = getCurrentStepIndex(status);
        if (idx === 0) return 'طلبك قيد المراجعة والتجهيز.';
        if (idx === 1) {
            if (status === 'shipped') return 'تم شحن بضاعتك، هي في الطريق!';
            return 'جاري تنفيذ وتجهيز الطلب للشحن.';
        }
        if (idx === 2) return `الشحنة وصلت حالياً إلى ${getArrivedLabel(status).replace('وصلت ', '')}.`;
        if (idx === 3) {
            if (status === 'out_for_delivery') return 'الشحنة خرجت للتسليم مع المندوب.';
            return 'تم تسليم الشحنة بنجاح.';
        }
        return 'حالة غير معروفة';
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col font-sans transition-colors duration-300 pb-24" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">تتبع الشحنة</h1>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center p-4 max-w-2xl mx-auto w-full space-y-6">

                {/* Search Input */}
                <div className="w-full space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search className="h-6 w-6" />
                        </div>
                        <Input
                            dir="ltr"
                            type="text"
                            placeholder="أدخل رقم الشحنة (مثال: TRX-123)"
                            className="h-16 pr-12 text-center text-xl font-bold tracking-wider rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button
                        className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-lg shadow-rose-500/25 transition-all active:scale-[0.98]"
                        onClick={() => handleSearch()}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "تتبع الآن"}
                    </Button>
                </div>

                {/* Recent Searches */}
                {!order && recentSearches.length > 0 && (
                    <div className="w-full">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            عمليات البحث الأخيرة
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((searchId) => (
                                <Badge
                                    key={searchId}
                                    variant="secondary"
                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                                    onClick={() => handleSearch(searchId)}
                                >
                                    {searchId}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400"
                    >
                        <XCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="font-medium">{error}</p>
                    </motion.div>
                )}

                {order && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-6"
                    >
                        {/* Status Summary Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

                            <div className="relative z-10 text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-wider mb-2">{order.trackingId}</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    {getStatusDescription(order.status)}
                                </p>
                            </div>

                            {/* 4-Step Timeline */}
                            <div className="relative z-10">
                                <div className="space-y-6 relative before:absolute before:right-[1.15rem] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700 before:z-0">
                                    {VISUAL_STEPS.map((step, index) => {
                                        const currentIndex = getCurrentStepIndex(order.status);
                                        const state = getStepState(index, currentIndex);

                                        // Dynamic label for Step 3
                                        const label = index === 2 ? getArrivedLabel(order.status) : step.label;

                                        return (
                                            <div key={step.id} className={`relative flex items-center gap-4 ${state === 'upcoming' ? 'opacity-50' : 'opacity-100'}`}>
                                                {/* Node Circle */}
                                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-[3px] shadow-sm transition-all duration-500 
                                                    ${state === 'current' ? 'border-blue-500 bg-blue-500 text-white scale-110' :
                                                        state === 'completed' ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-500' :
                                                            'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-300'}`}
                                                >
                                                    {state === 'completed' ? <CheckCircle className="w-5 h-5" /> : step.icon}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1">
                                                    <h4 className={`text-base font-bold ${state === 'current' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {label}
                                                    </h4>
                                                    {/* Show date only for current or completed steps if available - approximating with operation date for first step */}
                                                    {index === 0 && (state === 'completed' || state === 'current') && (
                                                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">{new Date(order.operationDate).toLocaleDateString('ar-LY')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Shipment Details Grid */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                                <Tag className="w-5 h-5 text-blue-500" />
                                تفاصيل الشحنة
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Weight className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">الوزن</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{order.weightKG} <span className="text-xs font-normal text-slate-500">كجم</span></p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">الإجمالي</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{order.sellingPriceLYD} <span className="text-xs font-normal text-slate-500">د.ل</span></p>
                                </div>
                                <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">العنوان</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{order.customerAddress}</p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default TrackShipmentPage;
