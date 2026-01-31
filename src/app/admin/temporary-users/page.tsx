
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Truck, CheckCircle, Clock, DollarSign, CreditCard, Package, Loader2, UserPlus, UserX, Printer, Search, Calendar, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TempOrder, OrderStatus, SubOrder, Representative, User } from '@/lib/types';
import { getTempOrders, updateTempOrder, deleteTempOrder, addTempOrderPayment, getRepresentatives, getUsers } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ReactNode; className: string } } = {
    pending: { text: 'قيد التجهيز', icon: <Clock className="w-4 h-4" />, className: 'bg-yellow-100 text-yellow-700' },
    processed: { text: 'تم التنفيذ', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-cyan-100 text-cyan-700' },
    ready: { text: 'تم التجهيز', icon: <Package className="w-4 h-4" />, className: 'bg-indigo-100 text-indigo-700' },
    shipped: { text: 'تم الشحن', icon: <Truck className="w-4 h-4" />, className: 'bg-blue-100 text-blue-700' },
    arrived_dubai: { text: 'وصلت إلى دبي', icon: <Package className="w-4 h-4" />, className: 'bg-orange-100 text-orange-700' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: <Package className="w-4 h-4" />, className: 'bg-teal-100 text-teal-700' },
    arrived_tobruk: { text: 'وصلت إلى طبرق', icon: <Package className="w-4 h-4" />, className: 'bg-purple-100 text-purple-700' },
    out_for_delivery: { text: 'مع المندوب', icon: <Truck className="w-4 h-4" />, className: 'bg-lime-100 text-lime-700' },
    delivered: { text: 'تم التسليم', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-green-100 text-green-700' },
    cancelled: { text: 'ملغي', icon: <Trash2 className="w-4 h-4" />, className: 'bg-red-100 text-red-700' },
    paid: { text: 'مدفوع', icon: <CreditCard className="w-4 h-4" />, className: 'bg-green-100 text-green-700' },
};

const AdminTemporaryUsersPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<TempOrder[]>([]);
    const [representatives, setRepresentatives] = useState<Representative[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<TempOrder | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentNotes, setPaymentNotes] = useState('');
    const [selectedSubOrderId, setSelectedSubOrderId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
    const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });


    const fetchInitialData = async () => {
        setIsLoading(true);
        const [fetchedOrders, fetchedReps, fetchedUsers] = await Promise.all([
            getTempOrders(),
            getRepresentatives(),
            getUsers()
        ]);
        setOrders(fetchedOrders);
        setRepresentatives(fetchedReps);
        setUsers(fetchedUsers);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Function to filter orders by date range
    const filterOrdersByDate = (orders: TempOrder[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return orders.filter(order => {
            // Use operationDate from first subOrder if available, otherwise use current date
            const orderDate = order.subOrders[0]?.operationDate
                ? new Date(order.subOrders[0].operationDate)
                : new Date();

            switch (dateFilter) {
                case 'daily':
                    return orderDate >= today;

                case 'weekly':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - 7);
                    return orderDate >= weekStart;

                case 'monthly':
                    const monthStart = new Date(today);
                    monthStart.setMonth(today.getMonth() - 1);
                    return orderDate >= monthStart;

                case 'yearly':
                    const yearStart = new Date(today);
                    yearStart.setFullYear(today.getFullYear() - 1);
                    return orderDate >= yearStart;

                case 'custom':
                    if (!customDateRange.from || !customDateRange.to) return true;
                    const from = new Date(customDateRange.from);
                    const to = new Date(customDateRange.to);
                    to.setHours(23, 59, 59, 999); // Include the entire end date
                    return orderDate >= from && orderDate <= to;

                case 'all':
                default:
                    return true;
            }
        });
    };

    const filteredOrders = useMemo(() => {
        let result = orders;

        // Apply date filter first
        result = filterOrdersByDate(result);

        // Then apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order =>
                order.invoiceName.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query) ||
                order.subOrders.some(so =>
                    so.customerName.toLowerCase().includes(query) ||
                    so.customerPhone?.toLowerCase().includes(query)
                )
            );
        }

        return result;
    }, [orders, searchQuery, dateFilter, customDateRange]);

    // Calculate totals - using paid amounts (totalAmount - remainingAmount)
    const accountTotals = useMemo(() => {
        const totals = {
            cash: 0,
            bank: 0
        };

        // Since TempOrder doesn't track payment method breakdown,
        // we'll calculate total paid amount for now
        // This needs proper implementation with payment tracking
        orders.forEach(order => {
            const paidAmount = order.totalAmount - order.remainingAmount;
            // For now, we'll show all in cash until payment method tracking is added
            totals.cash += paidAmount;
        });

        return totals;
    }, [orders]);


    const totalDebt = filteredOrders.filter(t => t.status !== 'cancelled').reduce((sum, t) => sum + t.remainingAmount, 0);
    const totalOrdersValue = filteredOrders.filter(t => t.status !== 'cancelled').reduce((sum, t) => sum + t.totalAmount, 0);

    const summaryCards = [
        { title: 'إجمالي الفواتير', value: `${filteredOrders.filter(o => o.status !== 'cancelled').length}`, icon: <Package className="w-6 h-6" /> },
        { title: 'إجمالي الديون', value: `${totalDebt.toFixed(2)} د.ل`, icon: <CreditCard className="w-6 h-6" />, color: 'text-destructive' },
        { title: 'القيمة الإجمالية', value: `${totalOrdersValue.toFixed(2)} د.ل`, icon: <DollarSign className="w-6 h-6" /> },
    ];

    const openPaymentDialog = (order: TempOrder) => {
        setCurrentOrder(order);
        setPaymentAmount(0);
        setPaymentNotes('');
        setSelectedSubOrderId('');
        setIsPaymentDialogOpen(true);
    };

    const openDeleteConfirm = (order: TempOrder) => {
        setCurrentOrder(order);
        setIsDeleteConfirmOpen(true);
    };

    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await updateTempOrder(orderId, { status });
            toast({ title: "تم تحديث الحالة بنجاح" });
            await fetchInitialData();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
        }
    };

    const handleAddPayment = async () => {
        if (!currentOrder || !selectedSubOrderId || paymentAmount <= 0) {
            toast({
                title: "خطأ في الإدخال",
                description: "الرجاء اختيار العميل وتحديد مبلغ الدفعة.",
                variant: "destructive"
            });
            return;
        }

        try {
            const success = await addTempOrderPayment(currentOrder.id, selectedSubOrderId, paymentAmount, paymentNotes);

            if (success) {
                toast({ title: "تم تسجيل الدفعة بنجاح" });
                setIsPaymentDialogOpen(false);
                await fetchInitialData(); // Refetch data to show updated balances
            } else {
                throw new Error("Failed to process payment in the backend");
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            toast({ title: "خطأ فادح", description: "فشل تسجيل الدفعة وتحديث الأرصدة.", variant: "destructive" });
        }
    };


    const handleDeleteOrder = async () => {
        if (currentOrder) {
            try {
                await deleteTempOrder(currentOrder.id);
                toast({ title: "تم حذف الفاتورة" });
                setIsDeleteConfirmOpen(false);
                setCurrentOrder(null);

                await fetchInitialData();

            } catch (error) {
                toast({ title: "خطأ", description: "فشل حذف الفاتورة.", variant: "destructive" });
            }
        }
    };

    const handleAssignRep = async (tempOrderId: string, subOrderId: string, rep: Representative | null) => {
        const orderToUpdate = orders.find(o => o.id === tempOrderId);
        if (!orderToUpdate) return;

        const updatedSubOrders = orderToUpdate.subOrders.map(so => {
            if (so.subOrderId === subOrderId) {
                const newStatus: OrderStatus = rep ? 'out_for_delivery' : 'pending';
                return { ...so, representativeId: rep?.id || null, representativeName: rep?.name || null, shipmentStatus: newStatus };
            }
            return so;
        });

        try {
            const success = await updateTempOrder(tempOrderId, { subOrders: updatedSubOrders });
            if (success) {
                toast({ title: rep ? "تم إسناد الطلب للمندوب بنجاح" : "تم إلغاء إسناد المندوب" });
                setOrders(prev => prev.map(o => o.id === tempOrderId ? { ...o, subOrders: updatedSubOrders } : o));
            } else {
                throw new Error("Failed to update temp order for rep assignment");
            }
        } catch (error) {
            console.error("Error assigning rep to sub-order:", error);
            toast({ title: "خطأ", description: "فشل إسناد الطلب.", variant: "destructive" });
        }
    };

    const handlePrintSubOrderLabel = (tempOrder: TempOrder, subOrder: SubOrder) => {
        const params = new URLSearchParams();
        params.append('invoiceNumber', `${tempOrder.invoiceName} / ${subOrder.customerName}`);
        params.append('operationDate', subOrder.operationDate || new Date().toISOString());
        params.append('customerName', subOrder.customerName);
        params.append('customerAddress', subOrder.customerAddress || '');
        params.append('customerPhone', subOrder.customerPhone || '');
        params.append('itemDescription', subOrder.itemDescription || '');
        params.append('trackingId', subOrder.trackingId || 'N/A');
        params.append('sellingPriceLYD', String(subOrder.sellingPriceLYD));
        params.append('remainingAmount', String(subOrder.remainingAmount));

        window.open(`/admin/shipping-label/print?${params.toString()}`, '_blank', 'height=842,width=595,resizable=yes,scrollbars=yes');
    };


    return (
        <>
            <div className="p-4 sm:p-6 space-y-6" dir="rtl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">إدارة المستخدمين المؤقتين</h1>
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="gap-1" onClick={() => router.push('/admin/temporary-users/add')}>
                            <PlusCircle className="h-4 w-4" />
                            إضافة فاتورة مجمعة
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-green-700">💵 إجمالي المدفوعات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-800">
                                {accountTotals.cash.toFixed(2)} <span className="text-lg">د.ل</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">إجمالي المبالغ المدفوعة</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-blue-700">⏳ المبالغ المتبقية</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-800">
                                {totalDebt.toFixed(2)} <span className="text-lg">د.ل</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">إجمالي المبالغ غير المسددة</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Date Filter Section */}
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Filter className="w-4 h-4" />
                                <span>فلترة القيم المالية:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant={dateFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('all')}
                                    className="gap-1"
                                >
                                    الكل
                                </Button>
                                <Button
                                    variant={dateFilter === 'daily' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('daily')}
                                    className="gap-1"
                                >
                                    يومي
                                </Button>
                                <Button
                                    variant={dateFilter === 'weekly' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('weekly')}
                                    className="gap-1"
                                >
                                    أسبوعي
                                </Button>
                                <Button
                                    variant={dateFilter === 'monthly' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('monthly')}
                                    className="gap-1"
                                >
                                    شهري
                                </Button>
                                <Button
                                    variant={dateFilter === 'yearly' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('yearly')}
                                    className="gap-1"
                                >
                                    سنوي
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={dateFilter === 'custom' ? 'default' : 'outline'}
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            مخصص
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>من تاريخ</Label>
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={customDateRange.from}
                                                    onSelect={(date) => {
                                                        setCustomDateRange(prev => ({ ...prev, from: date }));
                                                        setDateFilter('custom');
                                                    }}
                                                    disabled={(date) => date > new Date()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>إلى تاريخ</Label>
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={customDateRange.to}
                                                    onSelect={(date) => {
                                                        setCustomDateRange(prev => ({ ...prev, to: date }));
                                                        setDateFilter('custom');
                                                    }}
                                                    disabled={(date) =>
                                                        date > new Date() ||
                                                        (customDateRange.from ? date < customDateRange.from : false)
                                                    }
                                                />
                                            </div>
                                            {customDateRange.from && customDateRange.to && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setCustomDateRange({ from: undefined, to: undefined });
                                                        setDateFilter('all');
                                                    }}
                                                >
                                                    إعادة تعيين
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {dateFilter !== 'all' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setDateFilter('all');
                                            setCustomDateRange({ from: undefined, to: undefined });
                                        }}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        مسح الفلتر
                                    </Button>
                                )}
                            </div>
                        </div>
                        {dateFilter === 'custom' && customDateRange.from && customDateRange.to && (
                            <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <span className="font-medium">الفترة المحددة: </span>
                                {customDateRange.from.toLocaleDateString('ar-LY')} - {customDateRange.to.toLocaleDateString('ar-LY')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summaryCards.map((card, index) => (
                        <Card key={index} className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                                <div className={`text-primary ${card.color}`}>{card.icon}</div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle>قائمة الفواتير المجمعة</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Input
                                    placeholder="ابحث بالاسم، الهاتف، أو رقم الفاتورة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='text-right'>رقم الفاتورة</TableHead>
                                    <TableHead className='text-right'>الوصف</TableHead>
                                    <TableHead className='text-right'>العملاء</TableHead>
                                    <TableHead className='text-right'>الإجمالي</TableHead>
                                    <TableHead className='text-right'>المتبقي</TableHead>
                                    <TableHead className='text-right'>الحالة</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                                        <TableCell>
                                            {order.invoiceName}
                                            {order.assignedUserName && (
                                                <span className="text-xs text-muted-foreground block">
                                                    (مسندة إلى: {order.assignedUserName})
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{order.subOrders.map(so => so.customerName + (so.representativeName ? ` (${so.representativeName})` : '')).join(', ')}</TableCell>
                                        <TableCell>{order.totalAmount.toFixed(2)} د.ل</TableCell>
                                        <TableCell className={order.remainingAmount > 0 ? 'text-destructive' : ''}>
                                            {order.remainingAmount.toFixed(2)} د.ل
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`font-normal ${statusConfig[order.status as keyof typeof statusConfig]?.className}`}>
                                                {statusConfig[order.status as keyof typeof statusConfig]?.icon}
                                                <span className="mr-1">{statusConfig[order.status as keyof typeof statusConfig]?.text}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => router.push(`/admin/temporary-users/add?id=${order.id}`)}>
                                                        <Edit className="ml-2 h-4 w-4" /> عرض / تعديل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => openPaymentDialog(order)} disabled={order.remainingAmount <= 0}>
                                                        <DollarSign className="ml-2 h-4 w-4" /> دفع جزء
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <UserPlus className="ml-2 h-4 w-4" /> إسناد لمندوب
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {order.subOrders.map(so => (
                                                                <DropdownMenuSub key={so.subOrderId}>
                                                                    <DropdownMenuSubTrigger>
                                                                        {so.customerName} {so.representativeName && <span className="text-xs text-muted-foreground mr-2">({so.representativeName})</span>}
                                                                    </DropdownMenuSubTrigger>
                                                                    <DropdownMenuSubContent>
                                                                        <DropdownMenuItem onSelect={() => handleAssignRep(order.id, so.subOrderId, null)}>
                                                                            <UserX className="ml-2 h-4 w-4" /> إلغاء الإسناد
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        {representatives.map(rep => (
                                                                            <DropdownMenuItem key={rep.id} onSelect={() => handleAssignRep(order.id, so.subOrderId, rep)}>
                                                                                {rep.name}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuSub>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Printer className="ml-2 h-4 w-4" /> طباعة بوليصة
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {order.subOrders.map(so => (
                                                                <DropdownMenuItem key={so.subOrderId} onSelect={() => handlePrintSubOrderLabel(order, so)}>
                                                                    {so.customerName}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Truck className="ml-2 h-4 w-4" /> تحديث الحالة
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'pending')}>قيد التجهيز</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'shipped')}>تم الشحن</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'delivered')}>تم التسليم</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'cancelled')}>ملغي</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => openDeleteConfirm(order)} className="text-destructive focus:bg-destructive/30 focus:text-destructive-foreground">
                                                        <Trash2 className="ml-2 h-4 w-4" /> حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            {searchQuery ? 'لا توجد فواتير تطابق بحثك.' : 'لم يتم إضافة أي فواتير مجمعة بعد.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogContent dir='rtl' className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>تسجيل دفعة للفاتورة #{currentOrder?.id.slice(-6)}</DialogTitle>
                            <DialogDescription>
                                اختر العميل وقم بإدخال المبلغ المدفوع.
                            </DialogDescription>
                        </DialogHeader>
                        <Separator />
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="select-customer">اختر العميل</Label>
                                <Select value={selectedSubOrderId} onValueChange={setSelectedSubOrderId}>
                                    <SelectTrigger id="select-customer">
                                        <SelectValue placeholder="اختر العميل المراد سداد دينه" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentOrder?.subOrders.map(so => (
                                            <SelectItem key={so.subOrderId} value={so.subOrderId} disabled={so.remainingAmount <= 0}>
                                                <div className="flex justify-between w-full">
                                                    <span>{so.customerName}</span>
                                                    <span className="text-muted-foreground font-mono ml-4">
                                                        {so.remainingAmount > 0 ? `${so.remainingAmount.toFixed(2)} د.ل` : 'خالص'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment-amount">قيمة الدفعة (د.ل)</Label>
                                <Input
                                    id="payment-amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                    dir="ltr"
                                    placeholder='0.00'
                                    disabled={!selectedSubOrderId}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-notes">ملاحظات (اختياري)</Label>
                                <Textarea
                                    id="payment-notes"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="مثال: دفعة عن طريق الحساب البنكي..."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleAddPayment}>حفظ الدفعة</Button>
                            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>إلغاء</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <DialogContent dir='rtl'>
                        <DialogHeader>
                            <DialogTitle>تأكيد الحذف</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من رغبتك في حذف الفاتورة "#{currentOrder?.id.slice(-6)}؟
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={handleDeleteOrder}>حذف</Button>                  <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default AdminTemporaryUsersPage;
