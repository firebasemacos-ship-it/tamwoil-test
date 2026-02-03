'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Search, Calendar as CalendarIcon, FileDown, ArrowLeft, Filter } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ExternalDebt, Creditor, AccountType } from '@/lib/types';
import { getAllExternalDebts, getCreditors } from '@/lib/actions';
import { useToast } from "@/components/ui/use-toast";

const CreditorsReportsPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [debts, setDebts] = useState<ExternalDebt[]>([]);
    const [creditors, setCreditors] = useState<Creditor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccountType, setSelectedAccountType] = useState<AccountType | 'all'>('all');
    const [selectedCreditorId, setSelectedCreditorId] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedDebts, fetchedCreditors] = await Promise.all([
                getAllExternalDebts(),
                getCreditors()
            ]);
            setDebts(fetchedDebts);
            setCreditors(fetchedCreditors.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل تحميل البيانات.",
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
        let filtered = debts;

        // Date Filter
        if (dateRange?.from) {
            const from = startOfDay(dateRange.from);
            const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            filtered = filtered.filter(d => {
                const date = parseISO(d.date);
                return date >= from && date <= to;
            });
        }

        // Account Type Filter
        if (selectedAccountType !== 'all') {
            filtered = filtered.filter(d => (d.accountType || 'cash') === selectedAccountType);
        }

        // Creditor Filter
        if (selectedCreditorId !== 'all') {
            filtered = filtered.filter(d => d.creditorId === selectedCreditorId);
        }

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.creditorName.toLowerCase().includes(query) ||
                d.notes.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [debts, dateRange, selectedAccountType, selectedCreditorId, searchQuery]);

    const stats = useMemo(() => {
        const initialStats = {
            cashDebts: 0,
            cashCredits: 0,
            bankDebts: 0,
            bankCredits: 0,
            usdDebts: 0,
            usdCredits: 0,
        };

        return filteredData.reduce((acc, curr) => {
            const amount = curr.amount;
            const type = curr.accountType || 'cash';

            if (type === 'cash') {
                if (amount > 0) acc.cashDebts += amount;
                else acc.cashCredits += Math.abs(amount);
            } else if (type === 'bank') {
                if (amount > 0) acc.bankDebts += amount;
                else acc.bankCredits += Math.abs(amount);
            } else if (type === 'usd') {
                if (amount > 0) acc.usdDebts += amount;
                else acc.usdCredits += Math.abs(amount);
            }
            return acc;
        }, initialStats);
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
                        <h1 className="text-2xl font-bold">سجل التقارير المالية للذمم</h1>
                        <p className="text-muted-foreground">عرض مفصل لجميع الحركات المالية</p>
                    </div>
                </div>
                {/* Export not implemented yet, placeholder */}
                {/* <Button variant="outline" className="gap-2">
                    <FileDown className="w-4 h-4" />
                    تصدير Excel
                </Button> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">صافي حركة الكاش</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold">
                                {(stats.cashDebts - stats.cashCredits).toFixed(2)} د.ل
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="text-destructive font-medium">+{stats.cashDebts.toFixed(0)}</span> / <span className="text-green-600 font-medium">-{stats.cashCredits.toFixed(0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">صافي حركة المصرف</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold">
                                {(stats.bankDebts - stats.bankCredits).toFixed(2)} د.ل
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="text-destructive font-medium">+{stats.bankDebts.toFixed(0)}</span> / <span className="text-green-600 font-medium">-{stats.bankCredits.toFixed(0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">صافي حركة الدولار</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold">
                                {(stats.usdDebts - stats.usdCredits).toFixed(2)} $
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="text-destructive font-medium">+{stats.usdDebts.toFixed(0)}</span> / <span className="text-green-600 font-medium">-{stats.usdCredits.toFixed(0)}</span>
                            </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <Label>باسم الحساب</Label>
                            <Select value={selectedCreditorId} onValueChange={setSelectedCreditorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحساب" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {creditors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>نوع الحساب</Label>
                            <Select value={selectedAccountType} onValueChange={(v) => setSelectedAccountType(v as AccountType | 'all')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="cash">كاش</SelectItem>
                                    <SelectItem value="bank">مصرف</SelectItem>
                                    <SelectItem value="usd">دولار</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>بحث</Label>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="بحث في الوصف..."
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
                                <TableHead className="text-right">الحساب</TableHead>
                                <TableHead className="text-right">نوع الحساب</TableHead>
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
                                    const isDebit = item.amount > 0;
                                    const currency = item.accountType === 'usd' ? '$' : 'د.ل';
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {format(parseISO(item.date), 'yyyy/MM/dd')}
                                                <div className="text-xs text-muted-foreground">{format(parseISO(item.date), 'hh:mm a')}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{item.creditorName}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    item.accountType === 'cash' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                                    item.accountType === 'bank' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                                    item.accountType === 'usd' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                                )}>
                                                    {item.accountType === 'cash' ? 'كاش' : item.accountType === 'bank' ? 'مصرف' : 'دولار'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={item.notes}>{item.notes}</TableCell>
                                            <TableCell className="text-destructive font-bold">
                                                {isDebit ? `${Math.abs(item.amount).toFixed(2)} ${currency}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-green-600 font-bold">
                                                {!isDebit ? `${Math.abs(item.amount).toFixed(2)} ${currency}` : '-'}
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

export default CreditorsReportsPage;
