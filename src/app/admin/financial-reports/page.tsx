
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, CreditCard, MoreHorizontal, Edit, Trash2, TrendingUp, RefreshCcw, TrendingDown, Calendar as CalendarIcon, Loader2, Search, ArrowUpDown } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Transaction, Order, AppSettings, Expense, OrderStatus } from '@/lib/types';
import { getTransactions, deleteOrder, getOrders, getAppSettings, resetFinancialReports, getExpenses } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const statusConfig: { [key in OrderStatus]: { text: string; className: string } } = {
    pending: { text: 'قيد التجهيز', className: 'bg-yellow-100 text-yellow-700' },
    processed: { text: 'تم التنفيذ', className: 'bg-cyan-100 text-cyan-700' },
    ready: { text: 'تم التجهيز', className: 'bg-indigo-100 text-indigo-700' },
    shipped: { text: 'تم الشحن', className: 'bg-blue-100 text-blue-700' },
    arrived_dubai: { text: 'وصلت إلى دبي', className: 'bg-orange-100 text-orange-700' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', className: 'bg-teal-100 text-teal-700' },
    arrived_tobruk: { text: 'وصلت إلى طبرق', className: 'bg-purple-100 text-purple-700' },
    out_for_delivery: { text: 'مع المندوب', className: 'bg-lime-100 text-lime-700' },
    delivered: { text: 'تم التسليم', className: 'bg-green-100 text-green-700' },
    cancelled: { text: 'ملغي', className: 'bg-red-100 text-red-700' },
    paid: { text: 'مدفوع', className: 'bg-green-100 text-green-700' },
};

type SortableKeys = 'customerName' | 'date' | 'status' | 'amount';
type ChartDataPoint = {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
};


const FinancialReportsPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const [filterType, setFilterType] = useState<string>('monthly');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);


    const fetchData = async () => {
        setIsLoading(true);
        const [fetchedTransactions, fetchedOrders, fetchedSettings, fetchedExpenses] = await Promise.all([
            getTransactions(),
            getOrders(),
            getAppSettings(),
            getExpenses(),
        ]);
        setAllTransactions(fetchedTransactions);
        setAllOrders(fetchedOrders);
        setSettings(fetchedSettings);
        setAllExpenses(fetchedExpenses);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const { filteredTransactions, chartData, dateFilteredOrders } = useMemo(() => {
        const regularTransactions = allTransactions.filter(t => !t.customerId.startsWith('TEMP-'));
        const regularOrders = allOrders.filter(o => !o.userId.startsWith('TEMP-'));

        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        const now = new Date();

        switch (filterType) {
            case 'daily':
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case 'weekly':
                startDate = startOfWeek(now, { locale: ar });
                endDate = endOfWeek(now, { locale: ar });
                break;
            case 'monthly':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'yearly':
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            case 'custom':
                if(dateRange?.from) startDate = startOfDay(dateRange.from);
                if(dateRange?.to) endDate = endOfDay(dateRange.to);
                else if(dateRange?.from) endDate = endOfDay(dateRange.from);
                break;
        }
        
        let dateFilteredTransactions = regularTransactions;
        let dateFilteredExpenses = allExpenses;
        let dateFilteredOrders = regularOrders;

        if (startDate && endDate) {
            dateFilteredTransactions = regularTransactions.filter(t => {
                const tDate = parseISO(t.date);
                return tDate >= startDate! && tDate <= endDate!;
            });
            dateFilteredExpenses = allExpenses.filter(e => {
                const eDate = parseISO(e.date);
                return eDate >= startDate! && eDate <= endDate!;
            });
            dateFilteredOrders = regularOrders.filter(o => {
                const oDate = parseISO(o.operationDate);
                return oDate >= startDate! && oDate <= endDate!;
            });
        }
        
        let searchedTransactions = dateFilteredTransactions;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            searchedTransactions = dateFilteredTransactions.filter(t => {
                const order = regularOrders.find(o => o.id === t.orderId);
                return (
                    t.customerName.toLowerCase().includes(query) ||
                    t.customerId.toLowerCase().includes(query) ||
                    (order && (
                        order.invoiceNumber.toLowerCase().includes(query) ||
                        order.customerPhone?.toLowerCase().includes(query)
                    )) ||
                    t.description.toLowerCase().includes(query)
                );
            });
        }
        
        let sortedTransactions = [...searchedTransactions];
        if (sortConfig !== null) {
            sortedTransactions.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        // --- Chart Data Processing ---
        const dataMap: { [key: string]: { revenue: number; expenses: number; profit: number } } = {};
        const isLongRange = (endDate?.getTime() ?? 0) - (startDate?.getTime() ?? 0) > 31 * 24 * 60 * 60 * 1000;
        const dateFormat = isLongRange ? 'yyyy-MM' : 'yyyy-MM-dd';

        // Process payments for revenue
        dateFilteredTransactions.filter(t => t.type === 'payment').forEach(t => {
            const key = format(parseISO(t.date), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            dataMap[key].revenue += t.amount;
        });

        // Process expenses
        dateFilteredExpenses.forEach(e => {
            const key = format(parseISO(e.date), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            dataMap[key].expenses += e.amount;
        });

        // Process orders for profit
        dateFilteredOrders.filter(o => o.status !== 'cancelled').forEach(order => {
             const key = format(parseISO(order.operationDate), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            const purchasePriceUSD = order.purchasePriceUSD || 0;
            const shippingCostLYD = order.shippingCostLYD || 0;
            const exchangeRate = order.exchangeRate || settings?.exchangeRate || 1;
            const purchaseCostLYD = purchasePriceUSD * exchangeRate;
            const netProfitForOrder = order.sellingPriceLYD - purchaseCostLYD - shippingCostLYD;
            dataMap[key].profit += netProfitForOrder;
        });

        const finalChartData = Object.keys(dataMap).map(key => ({
            date: key,
            revenue: dataMap[key].revenue,
            expenses: dataMap[key].expenses,
            profit: dataMap[key].profit,
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return {
            filteredTransactions: sortedTransactions,
            chartData: finalChartData,
            dateFilteredOrders: dateFilteredOrders
        };

    }, [filterType, dateRange, allTransactions, allOrders, allExpenses, searchQuery, sortConfig, settings]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-4 h-4 ml-2 text-muted-foreground" />;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };


    const openDeleteDialog = (transaction: Transaction) => {
        if (transaction.type === 'order' && transaction.orderId) {
            setTransactionToDelete(transaction);
            setIsDeleteDialogOpen(true);
        } else {
            toast({
                title: "لا يمكن الحذف",
                description: "يمكن فقط حذف المعاملات من نوع 'طلب'. لحذف دفعة، يرجى تعديل الطلب الأصلي.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (transactionToDelete && transactionToDelete.orderId) {
            const success = await deleteOrder(transactionToDelete.orderId);
            if (success) {
                toast({ title: "تم حذف الطلب بنجاح" });
                fetchData();
            } else {
                toast({ title: "خطأ", description: "فشل حذف الطلب.", variant: "destructive" });
            }
        }
        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
    };
    
    const handleResetReports = async () => {
        const success = await resetFinancialReports();
        if(success) {
            toast({ title: "تم تصفير التقارير بنجاح" });
            fetchData();
        } else {
             toast({ title: "خطأ", description: "فشل تصفير التقارير.", variant: "destructive" });
        }
        setIsResetDialogOpen(false);
    }

    const { totalRevenue, totalDebt, totalExpenses, netProfit } = useMemo(() => {
        const revenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
        const expenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
        const profit = chartData.reduce((sum, item) => sum + item.profit, 0);
        
        // Correct way to calculate debt for the selected period
        const debt = dateFilteredOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, order) => sum + order.remainingAmount, 0);

        return { 
            totalRevenue: revenue, 
            totalDebt: debt, 
            totalExpenses: expenses, 
            netProfit: profit - expenses 
        };
    }, [chartData, dateFilteredOrders]);


    const summaryCards = [
        { title: 'إجمالي الإيرادات', value: `${totalRevenue.toFixed(2)} د.ل`, icon: <DollarSign className="w-6 h-6" />, color: 'text-green-600' },
        { title: 'إجمالي الديون', value: `${totalDebt.toFixed(2)} د.ل`, icon: <CreditCard className="w-6 h-6" />, color: 'text-destructive' },
        { title: 'إجمالي المصروفات', value: `${totalExpenses.toFixed(2)} د.ل`, icon: <TrendingDown className="w-6 h-6" />, color: 'text-destructive' },
        { title: 'صافي الربح', value: `${netProfit.toFixed(2)} د.ل`, icon: <TrendingUp className="w-6 h-6" />, color: netProfit >= 0 ? 'text-primary' : 'text-destructive' },
    ];
    
    const handleFilterChange = (type: string) => {
        setFilterType(type);
        const now = new Date();
        if (type === 'daily') setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        else if (type === 'weekly') setDateRange({ from: startOfWeek(now, { locale: ar }), to: endOfWeek(now, { locale: ar }) });
        else if (type === 'monthly') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        else if (type === 'yearly') setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        else if (type === 'all') setDateRange(undefined);
    }
    
    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        setFilterType('custom');
    }

    const getFilterLabel = () => {
        switch (filterType) {
            case 'daily': return `اليوم: ${format(new Date(), 'd MMMM yyyy', {locale: ar})}`;
            case 'weekly': return 'هذا الأسبوع';
            case 'monthly': return 'هذا الشهر';
            case 'yearly': return 'هذه السنة';
            case 'custom': 
                if (dateRange?.from && dateRange?.to) {
                    return `${format(dateRange.from, 'd MMM', {locale: ar})} - ${format(dateRange.to, 'd MMM yyyy', {locale: ar})}`;
                }
                if(dateRange?.from) return `تاريخ: ${format(dateRange.from, 'd MMMM yyyy', {locale: ar})}`;
                return 'فترة مخصصة';
            default: return 'عرض كل التقارير';
        }
    }

    return (
        <div className="p-4 sm:p-6" dir="rtl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">التقارير المالية</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsResetDialogOpen(true)} variant="destructive" className="gap-2">
                        <RefreshCcw className="w-4 h-4" />
                        تصفير
                    </Button>
                </div>
            </div>

            <main className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <CardTitle>الأداء المالي خلال الفترة</CardTitle>
                        <CardDescription>{getFilterLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-80"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => `${value.toFixed(2)} د.ل`}
                                            labelFormatter={(label) => `التاريخ: ${label}`}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius)',
                                                direction: 'rtl'
                                            }}
                                        />
                                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                                        <Bar dataKey="revenue" fill="var(--color-green-600, #16a34a)" name="الإيرادات" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expenses" fill="var(--color-destructive, #dc2626)" name="المصروفات" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="profit" fill="var(--color-primary, #3b82f6)" name="صافي الربح" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>سجل المعاملات</CardTitle>
                                    <p className="text-sm text-muted-foreground pt-1">{getFilterLabel()}</p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                     <Input 
                                        placeholder="ابحث بالهاتف، الاسم، الفاتورة..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pr-10"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-4">
                            <Button variant={filterType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('all')}>الكل</Button>
                            <Button variant={filterType === 'daily' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('daily')}>اليوم</Button>
                            <Button variant={filterType === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('weekly')}>أسبوعي</Button>
                            <Button variant={filterType === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('monthly')}>شهري</Button>
                            <Button variant={filterType === 'yearly' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('yearly')}>سنوي</Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    size="sm"
                                    className={cn("w-[240px] justify-start text-right font-normal", filterType === 'custom' && "border-primary")}
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
                                    onSelect={handleDateRangeSelect}
                                    numberOfMonths={2}
                                    locale={ar}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='text-right whitespace-nowrap'>رقم الفاتورة</TableHead>
                                    <TableHead className='text-right whitespace-nowrap cursor-pointer' onClick={() => requestSort('customerName')}>
                                        <div className='flex items-center'>العميل {getSortIndicator('customerName')}</div>
                                    </TableHead>
                                    <TableHead className='text-right whitespace-nowrap cursor-pointer' onClick={() => requestSort('date')}>
                                         <div className='flex items-center'>التاريخ {getSortIndicator('date')}</div>
                                    </TableHead>
                                    <TableHead className='text-right whitespace-nowrap'>النوع</TableHead>
                                    <TableHead className='text-right whitespace-nowrap cursor-pointer' onClick={() => requestSort('status')}>
                                         <div className='flex items-center'>الحالة {getSortIndicator('status')}</div>
                                    </TableHead>
                                    <TableHead className='text-right whitespace-nowrap cursor-pointer' onClick={() => requestSort('amount')}>
                                         <div className='flex items-center'>المبلغ {getSortIndicator('amount')}</div>
                                    </TableHead>
                                    <TableHead className='text-right'>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                ) : filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => {
                                        const order = allOrders.find(o => o.id === transaction.orderId);
                                        return (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {order ? (
                                                        <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                                                            {order.invoiceNumber}
                                                        </Link>
                                                    ) : (
                                                        transaction.description
                                                    )}
                                                </TableCell>
                                                <TableCell>{transaction.customerName} ({transaction.customerId.slice(-4)})</TableCell>
                                                <TableCell>{new Date(transaction.date).toLocaleDateString('ar-LY')}</TableCell>
                                                <TableCell>
                                                    {transaction.type === 'order' ? 'طلب' : 'دفعة'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`font-normal ${statusConfig[transaction.status as keyof typeof statusConfig]?.className}`}>
                                                        {statusConfig[transaction.status as keyof typeof statusConfig]?.text}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={`${transaction.type === 'order' ? "text-destructive" : "text-green-600"}`}>
                                                    {transaction.amount.toFixed(2)} د.ل
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
                                                            <DropdownMenuItem
                                                                onSelect={() => router.push(`/admin/orders/add?id=${transaction.orderId}`)}
                                                                disabled={!transaction.orderId}
                                                            >
                                                                <Edit className="ml-2 h-4 w-4" /> عرض / تعديل
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => openDeleteDialog(transaction)}
                                                                className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90"
                                                                disabled={transaction.type !== 'order'}
                                                            >
                                                                <Trash2 className="ml-2 h-4 w-4" /> حذف الطلب
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={7} className="text-center">لا توجد معاملات تطابق معايير البحث.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تأكيد الحذف</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من رغبتك في حذف الطلب رقم #{transactionToDelete?.orderId?.slice(-6)}؟
                            سيتم حذف الطلب وجميع معاملاته المالية المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>نعم، قم بالحذف</Button>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تأكيد تصفير التقارير</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد تمامًا من رغبتك في تصفير التقارير المالية؟
                            سيتم حذف <span className="font-bold text-destructive">جميع المعاملات المالية والمصروفات</span> بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive" onClick={handleResetReports}>نعم، قم بالتصفير</Button>
                        <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinancialReportsPage;

    