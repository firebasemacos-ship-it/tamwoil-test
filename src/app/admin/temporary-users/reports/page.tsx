'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2, Search, Calendar as CalendarIcon, ArrowLeft, Filter } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { TempOrder, Transaction, SubOrder } from '@/lib/types';
import { getTempOrders, getTransactions } from '@/lib/actions';
import { useToast } from "@/components/ui/use-toast";

type FinancialRecord = {
    id: string;
    date: string;
    customerName: string;
    type: 'debt' | 'payment';
    amount: number;
    description: string;
    relatedId?: string; // Order ID or Transaction ID
};

const TemporaryUsersReportsPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'debt' | 'payment'>('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [tempOrders, allTransactions] = await Promise.all([
                getTempOrders(),
                getTransactions()
            ]);

            const newRecords: FinancialRecord[] = [];

            // 1. Process Temp Orders (Debts) - Only unassigned ones or track all?
            // "Temporary Users" usually implies unassigned. Assigned ones act as real users.
            // However, the debt is on the sub-order level.
            tempOrders.filter(o => !o.assignedUserId).forEach(order => {
                order.subOrders.forEach(sub => {
                    newRecords.push({
                        id: `debt-${sub.subOrderId}`,
                        date: sub.operationDate || order.createdAt,
                        customerName: sub.customerName,
                        type: 'debt',
                        amount: sub.sellingPriceLYD,
                        description: `فاتورة مجمعة #${order.id.slice(-6)}: ${order.invoiceName}`,
                        relatedId: order.id
                    });
                });
            });

            // 2. Process Transactions (Payments)
            // Filter transactions where customerId starts with 'TEMP-'
            const tempTransactions = allTransactions.filter(t => t.customerId && t.customerId.startsWith('TEMP-'));

            tempTransactions.forEach(tx => {
                newRecords.push({
                    id: tx.id,
                    date: tx.date,
                    customerName: tx.customerName || 'عميل غير معروف',
                    type: 'payment',
                    amount: tx.amount, // Payment amount
                    description: tx.description || 'دفعة مالية',
                    relatedId: tx.orderId || undefined
                });
            });

            // Sort by date descending
            newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setRecords(newRecords);

        } catch (error) {
            console.error("Error fetching report data:", error);
            toast({
                title: "خطأ",
                description: "فشل تحميل بيانات التقرير.",
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let filtered = records;

        // Date Filter
        if (dateRange?.from) {
            const from = startOfDay(dateRange.from);
            const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            filtered = filtered.filter(r => {
                const date = parseISO(r.date);
                return date >= from && date <= to;
            });
        }

        // Type Filter
        if (selectedType !== 'all') {
            filtered = filtered.filter(r => r.type === selectedType);
        }

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.customerName.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [records, dateRange, selectedType, searchQuery]);

    const stats = useMemo(() => {
        return filteredData.reduce((acc, curr) => {
            if (curr.type === 'debt') {
                acc.totalDebt += curr.amount;
            } else {
                acc.totalPaid += curr.amount;
            }
            return acc;
        }, { totalDebt: 0, totalPaid: 0 });
    }, [filteredData]);

    return (
        <div className="p-4 sm:p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">سجل التقارير المالية للمستخدمين المؤقتين</h1>
                        <p className="text-muted-foreground">عرض مفصل لجميع الديون والدفعات (غير المسندة)</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-background border-red-200 dark:border-red-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">إجمالي الديون المسجلة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalDebt.toFixed(2)} د.ل
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">إجمالي المدفوعات المسجلة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalPaid.toFixed(2)} د.ل
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">تصفية البيانات</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>النطاق الزمني</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>اختر فترة</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={ar}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>نوع الحركة</Label>
                            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as 'all' | 'debt' | 'payment')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="debt">دين (فواتير)</SelectItem>
                                    <SelectItem value="payment">دفعات</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>بحث</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="اسم العميل، الوصف..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">العميل</TableHead>
                                <TableHead className="text-right">نوع الحركة</TableHead>
                                <TableHead className="text-right">البيان</TableHead>
                                <TableHead className="text-right text-destructive">مدين (عليه)</TableHead>
                                <TableHead className="text-right text-green-600">دائن (له)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => {
                                    const isDebt = item.type === 'debt';
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {format(parseISO(item.date), 'yyyy/MM/dd')}
                                                <div className="text-xs text-muted-foreground">{format(parseISO(item.date), 'hh:mm a')}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{item.customerName}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    isDebt ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                )}>
                                                    {isDebt ? 'فاتورة' : 'دفعة'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={item.description}>{item.description}</TableCell>
                                            <TableCell className="text-destructive font-bold">
                                                {isDebt ? `${item.amount.toFixed(2)} د.ل` : '-'}
                                            </TableCell>
                                            <TableCell className="text-green-600 font-bold">
                                                {!isDebt ? `${item.amount.toFixed(2)} د.ل` : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        لا توجد بيانات مطابقة للمعايير المحددة
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default TemporaryUsersReportsPage;
