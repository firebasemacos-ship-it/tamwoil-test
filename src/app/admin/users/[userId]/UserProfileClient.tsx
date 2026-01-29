'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Order, Transaction, User, OrderStatus } from '@/lib/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    User as UserIcon,
    Phone,
    Home,
    ShoppingCart,
    CreditCard,
    ListOrdered,
    ArrowRight,
    Printer,
    MapPin,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet
} from 'lucide-react';
import Link from 'next/link';

interface UserProfileClientProps {
    user: User;
    orders: Order[];
    transactions: Transaction[];
    totalOrdersValue: number;
    totalOrdersCount: number;
    totalDebt: number;
}

const statusConfig: { [key in OrderStatus]: { text: string; className: string } } = {
    pending: { text: 'قيد التجهيز', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    processed: { text: 'تم التنفيذ', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    ready: { text: 'تم التجهيز', className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    shipped: { text: 'تم الشحن', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    arrived_dubai: { text: 'وصلت دبي', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    arrived_benghazi: { text: 'وصلت بنغازي', className: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
    arrived_tobruk: { text: 'وصلت طبرق', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    out_for_delivery: { text: 'مع المندوب', className: 'bg-lime-500/10 text-lime-500 border-lime-500/20' },
    delivered: { text: 'تم التسليم', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    cancelled: { text: 'ملغي', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    paid: { text: 'مدفوع', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export const UserProfileClient = ({
    user,
    orders,
    transactions,
    totalOrdersValue,
    totalOrdersCount,
    totalDebt
}: UserProfileClientProps) => {

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* Navigation & Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/users">
                    <Button variant="ghost" className="rounded-full w-12 h-12 p-0 hover:bg-black/5 dark:hover:bg-white/10">
                        <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-foreground">ملف المستخدم</h1>
            </div>

            {/* Hero Section */}
            <motion.div variants={itemVariant}>
                <GlassCard variant="premium" className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1 shadow-xl shadow-primary/20">
                                <div className="w-full h-full rounded-full bg-black/5 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                                    <span className="text-4xl font-bold text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
                                    {user.name}
                                    <Badge variant="outline" className="text-xs font-normal bg-primary/10 text-primary border-primary/20">
                                        عميل
                                    </Badge>
                                </h2>
                                <div className="flex flex-wrap gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                        <UserIcon className="w-4 h-4" />
                                        @{user.username}
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                        <Phone className="w-4 h-4" />
                                        <span dir="ltr">{user.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {user.address || 'غير محدد'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <Link href={`/admin/users/${user.id}/print`} target="_blank">
                                <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                    <Printer className="w-4 h-4" />
                                    طباعة كشف حساب
                                </Button>
                            </Link>
                            <Link href={`/admin/orders/add?userId=${user.id}&name=${user.name}&phone=${user.phone}&address=${user.address}`}>
                                <Button className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25">
                                    <ShoppingCart className="w-4 h-4" />
                                    طلب جديد
                                </Button>
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariant}>
                    <GlassCard variant="neon" className="border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">إجمالي الطلبات</p>
                                <h3 className="text-3xl font-black text-foreground">{totalOrdersValue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">د.ل</span></h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Wallet className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariant}>
                    <GlassCard variant="neon" className="border-l-4 border-l-red-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">الدين المستحق</p>
                                <h3 className="text-3xl font-black text-blue-500">{totalDebt.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">د.ل</span></h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariant}>
                    <GlassCard variant="neon" className="border-l-4 border-l-purple-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">عدد الطلبات</p>
                                <h3 className="text-3xl font-black text-foreground">{totalOrdersCount} <span className="text-sm font-normal text-muted-foreground">طلب</span></h3>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <ListOrdered className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Orders Section */}
                <motion.div variants={itemVariant} className="lg:col-span-2">
                    <GlassCard className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                سجل الطلبات
                            </h3>
                            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                                {orders.length} طلب
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {orders.length > 0 ? (
                                orders.map((order) => {
                                    const statusStyle = statusConfig[order.status] || { text: order.status, className: 'bg-gray-100 text-gray-500' };
                                    return (
                                        <div key={order.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-primary/20 transition-all duration-300">
                                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                                <div className={`w-2 h-12 rounded-full ${order.remainingAmount > 0 ? 'bg-blue-500' : 'bg-green-500'}`} />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-foreground">#{order.invoiceNumber}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusStyle.className}`}>
                                                            {statusStyle.text}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(order.operationDate).toLocaleDateString('ar-LY')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                                <div className="text-left">
                                                    <p className="text-xs text-muted-foreground">المتبقي</p>
                                                    <p className={`font-bold ${order.remainingAmount > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                                                        {order.remainingAmount.toLocaleString()} <span className="text-[10px]">د.ل</span>
                                                    </p>
                                                </div>

                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/20 hover:text-primary">
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCart className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground">لا توجد طلبات مسجلة</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Transactions Section */}
                <motion.div variants={itemVariant}>
                    <GlassCard className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-primary" />
                                المعاملات المالية
                            </h3>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="relative pl-4 border-r-2 border-black/5 dark:border-white/5 last:border-0 pb-6 last:pb-0">
                                        <div className={`absolute -right-[5px] top-0 w-2.5 h-2.5 rounded-full ${tx.type === 'payment' ? 'bg-green-500 ring-4 ring-green-500/20' : 'bg-blue-500 ring-4 ring-blue-500/20'}`} />

                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-bold text-foreground">{tx.type === 'payment' ? 'دفعة مستلمة' : 'دين جديد'}</span>
                                            <span className={`font-mono font-bold text-sm ${tx.type === 'payment' ? 'text-green-500' : 'text-blue-500'}`}>
                                                {tx.type === 'payment' ? '+' : '-'}{tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{tx.description}</p>
                                        <span className="text-[10px] text-muted-foreground/70 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                            {new Date(tx.date).toLocaleDateString('ar-LY')}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">لا توجد معاملات</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

            </div>
        </motion.div>
    );
};
