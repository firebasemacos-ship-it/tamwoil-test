
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Order, OrderStatus, Representative, Transaction } from '@/lib/types';
import { getOrderById, getRepresentativeById, getTransactionsByOrderId } from '@/lib/actions';
import { Loader2, ArrowLeft, Clock, Truck, Building, Plane, MapPin, PackageCheck, PackageX, CheckCircle, User, Phone, Copy, DollarSign, CreditCard, Weight, Package as PackageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ReactNode; className: string } } = {
    pending: { text: 'قيد التجهيز', icon: <Clock className="w-5 h-5" />, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    processed: { text: 'تم التنفيذ', icon: <CheckCircle className="w-5 h-5" />, className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    ready: { text: 'تم التجهيز', icon: <PackageIcon className="w-5 h-5" />, className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    shipped: { text: 'تم الشحن', icon: <Truck className="w-5 h-5" />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
    arrived_dubai: { text: 'وصلت إلى دبي', icon: <Plane className="w-5 h-5" />, className: 'bg-orange-100 text-orange-700 border-orange-200' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: <Building className="w-5 h-5" />, className: 'bg-teal-100 text-teal-700 border-teal-200' },
    arrived_tobruk: { text: 'وصلت إلى طبرق', icon: <Building className="w-5 h-5" />, className: 'bg-purple-100 text-purple-700 border-purple-200' },
    out_for_delivery: { text: 'مع المندوب', icon: <MapPin className="w-5 h-5" />, className: 'bg-lime-100 text-lime-700 border-lime-200' },
    delivered: { text: 'تم التسليم', icon: <PackageCheck className="w-5 h-5" />, className: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { text: 'ملغي', icon: <PackageX className="w-5 h-5" />, className: 'bg-red-100 text-red-700 border-red-200' },
    paid: { text: 'مدفوع', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-green-100 text-green-700' },
};

const OrderDetailsContent = () => {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;
    const { toast } = useToast();
    
    const [order, setOrder] = useState<Order | null>(null);
    const [representative, setRepresentative] = useState<Representative | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const fetchedOrder = await getOrderById(orderId);
                    setOrder(fetchedOrder);
                    
                    if (fetchedOrder?.representativeId) {
                        const fetchedRep = await getRepresentativeById(fetchedOrder.representativeId);
                        setRepresentative(fetchedRep);
                    }
                    
                    if (fetchedOrder) {
                        const fetchedTransactions = await getTransactionsByOrderId(fetchedOrder.id);
                        setTransactions(fetchedTransactions);
                    }
                    
                } catch (error) {
                    toast({ title: "خطأ", description: "فشل في تحميل بيانات الطلب.", variant: "destructive" });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [orderId, toast]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "تم النسخ!",
                description: `تم نسخ ${label} إلى الحافظة.`,
            });
        });
    };

    const totalPaid = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

    const shipmentWeight = order?.weightKG || 0;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-secondary/50">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center text-center p-4" dir="rtl">
                <div>
                     <h1 className="text-xl font-bold text-destructive">تعذر العثور على الطلب</h1>
                     <p className="text-muted-foreground mt-2">قد يكون الطلب قد تم حذفه أو أن الرابط غير صحيح.</p>
                      <Button onClick={() => router.back()} className="mt-6">العودة</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary/50" dir="rtl">
             <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold flex-grow text-center">تفاصيل الطلب: {order.invoiceNumber}</h1>
                <button onClick={() => router.back()} className="text-primary-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>حالة الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                         <Badge variant="outline" className={`font-semibold text-lg py-3 px-6 gap-2 ${statusConfig[order.status].className}`}>
                            {statusConfig[order.status].icon}
                            {statusConfig[order.status].text}
                        </Badge>
                    </CardContent>
                </Card>

                 <Card>
                     <CardHeader>
                        <CardTitle>تفاصيل الشحنة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground"><PackageIcon className="w-4 h-4"/> وصف السلعة:</span>
                            <span className="font-bold">{order.itemDescription || 'غير محدد'}</span>
                       </div>
                       <Separator/>
                       <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground"><Weight className="w-4 h-4"/> وزن الشحنة:</span>
                            <span className="font-bold">{shipmentWeight.toFixed(2)} كجم</span>
                       </div>
                    </CardContent>
                </Card>


                {representative && (
                     <Card>
                        <CardHeader>
                            <CardTitle>بيانات المندوب</CardTitle>
                            <CardDescription>المندوب المسؤول عن توصيل شحنتك.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4"/> الاسم:</span>
                                <span className="font-bold">{representative.name}</span>
                           </div>
                            <Separator/>
                           <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4"/> رقم الهاتف:</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold font-mono tracking-wider">{representative.phone}</span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(representative.phone, 'رقم هاتف المندوب')}>
                                        <Copy className="w-4 h-4"/>
                                    </Button>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                )}
                
                <Card>
                     <CardHeader>
                        <CardTitle>الملخص المالي</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4"/> إجمالي الفاتورة:</span>
                            <span className="font-bold text-primary text-lg">{order.sellingPriceLYD.toFixed(2)} د.ل</span>
                       </div>
                       <Separator/>
                       <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4 text-green-500"/> إجمالي المدفوع:</span>
                            <span className="font-bold text-green-600">{totalPaid.toFixed(2)} د.ل</span>
                       </div>
                        <Separator/>
                       <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4 text-destructive"/> المبلغ المتبقي:</span>
                            <span className="font-bold text-destructive text-lg">{order.remainingAmount.toFixed(2)} د.ل</span>
                       </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>سجل العمليات المالية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الوصف</TableHead>
                                    <TableHead className="text-left">المبلغ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{new Date(tx.date).toLocaleDateString('ar-LY')}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className={`text-left font-bold ${tx.type === 'payment' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.type === 'payment' ? '+' : '-'}{tx.amount.toFixed(2)} د.ل
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            لا توجد عمليات مالية مسجلة لهذا الطلب بعد.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-secondary/50"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <OrderDetailsContent />
        </Suspense>
    );
}
