'use client';

import { useState, useEffect } from 'react';
import { Card, CardPackage, CardVariant, AppSettings } from '@/lib/types';
import { getCards, addCard, deleteCard, getCardPackages, addCardPackage, updateCardPackage, deleteCardPackage, getAppSettings, updateAppSettings } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card as UICard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Trash2, Edit, Upload, Settings, DollarSign, ListPlus, X, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function AdminCardsPage() {
    const [activeTab, setActiveTab] = useState('packages');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Data
    const [packages, setPackages] = useState<CardPackage[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Form State for Package
    const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<CardPackage | null>(null);
    const [packageForm, setPackageForm] = useState<{
        service: string;
        category: string;
        variants: CardVariant[];
        image: string;
        profitMarginCash: number;
        profitMarginBank: number;
        profitMarginBalance: number;
    }>({
        service: '',
        category: 'Games',
        variants: [],
        image: '',
        profitMarginCash: 0,
        profitMarginBank: 0,
        profitMarginBalance: 0
    });

    // Bulk Add State
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [bulkCodes, setBulkCodes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pkgs, cardsData, settingsData] = await Promise.all([
                getCardPackages(),
                getCards(),
                getAppSettings()
            ]);
            setPackages(pkgs);
            setCards(cardsData);
            setSettings(settingsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast({ title: "خطأ", description: "حدث خطأ أثناء تحميل البيانات", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const [isUploading, setIsUploading] = useState(false);

    // --- Package Management ---
    const handleAddPackage = () => {
        setEditingPackage(null);
        setPackageForm({
            service: '',
            category: 'Games',
            variants: [{ id: crypto.randomUUID(), name: '', costUSD: 0 }],
            image: '',
            profitMarginCash: 0,
            profitMarginBank: 0,
            profitMarginBalance: 0
        });
        setIsPackageDialogOpen(true);
    };

    const handleEditPackage = (pkg: CardPackage) => {
        setEditingPackage(pkg);
        setPackageForm({
            service: pkg.service,
            category: pkg.category,
            variants: pkg.variants || [],
            image: pkg.image || '',
            profitMarginCash: pkg.profitMarginCash || 0,
            profitMarginBank: pkg.profitMarginBank || 0,
            profitMarginBalance: pkg.profitMarginBalance || 0
        });
        setIsPackageDialogOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            // ⚠️ هام: يفضل وضع هذا المفتاح في متغيرات البيئة (.env)
            // NEXT_PUBLIC_IMGBB_API_KEY=your_key_here
            const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '008ca2bea04c98457958b363da636b5c';

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                setPackageForm(prev => ({ ...prev, image: data.data.url }));
                toast({ title: "تم الرفع بنجاح", description: "تم تحديث الصورة من ImgBB" });
            } else {
                toast({ title: "فشل الرفع", description: "حدث خطأ أثناء رفع الصورة لـ ImgBB", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشل الاتصال بخدمة الصور", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Variant Helper Functions
    const addVariant = () => {
        setPackageForm(prev => ({
            ...prev,
            variants: [...prev.variants, { id: crypto.randomUUID(), name: '', costUSD: 0 }]
        }));
    };

    const removeVariant = (id: string) => {
        setPackageForm(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v.id !== id)
        }));
    };

    const updateVariant = (id: string, field: keyof CardVariant, value: any) => {
        setPackageForm(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
        }));
    };

    const calculatePrice = (costUSD: number, margin: number) => {
        if (!settings?.exchangeRate) return 0;
        const priceUSD = costUSD * (1 + margin / 100);
        return (priceUSD * settings.exchangeRate).toFixed(2);
    };

    const handleSubmitPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...packageForm,
                active: true
            };

            if (editingPackage) {
                await updateCardPackage(editingPackage.id, dataToSave);
                setPackages(prev => prev.map(p => p.id === editingPackage.id ? { ...p, ...dataToSave } as CardPackage : p));
                toast({ title: "تم بنجاح", description: "تم تحديث الخدمة" });
            } else {
                const newPkg = await addCardPackage(dataToSave as any);
                if (newPkg) setPackages(prev => [...prev, newPkg]);
                toast({ title: "تم بنجاح", description: "تم إضافة الخدمة" });
            }
            setIsPackageDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشلت العملية", variant: "destructive" });
        }
    };

    const handleDeletePackage = async (id: string) => {
        if (!confirm('هل أنت متأكد؟ سيتم حذف الخدمة وجميع تعريفات بطاقاتها.')) return;
        await deleteCardPackage(id);
        setPackages(prev => prev.filter(p => p.id !== id));
    };

    // --- Bulk Codes ---
    const getStockCount = (serviceName: string, variantName: string) => {
        return cards.filter(c =>
            c.service === serviceName &&
            c.name === variantName &&
            c.status === 'available'
        ).length;
    };

    const handleBulkSubmit = async () => {
        if (!selectedPackageId || !selectedVariantId || !bulkCodes.trim()) return;

        const pkg = packages.find(p => p.id === selectedPackageId);
        const variant = pkg?.variants.find(v => v.id === selectedVariantId);

        if (!pkg || !variant) return;

        const codes = bulkCodes.split('\n').filter(c => c.trim().length > 0);
        let addedCount = 0;

        try {
            // Store snapshot price? Or just assume dynamic?
            // The request was "not store stock/price" for USER view, but ADMIN might still want to track?
            // Let's store the current CASH price as a reference, but the user purchase flow is dynamic anyway.
            const priceLYD = Number(calculatePrice(variant.costUSD, pkg.profitMarginCash));

            for (const code of codes) {
                await addCard({
                    category: pkg.category,
                    service: pkg.service,
                    name: variant.name,
                    code: code.trim(),
                    cost: variant.costUSD,
                    price: priceLYD,
                    currency: 'LYD',
                    status: 'available',
                    createdAt: new Date().toISOString()
                } as any);
                addedCount++;
            }
            toast({ title: "تم الإضافة", description: `تم إضافة ${addedCount} كود بنجاح` });
            const newCards = await getCards();
            setCards(newCards);
            setIsBulkAddOpen(false);
            setBulkCodes('');
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشل إضافة الأكواد", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ListPlus className="w-8 h-8 text-primary" />
                    إدارة البطاقات والأسعار
                </h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg px-4">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold">سعر الصرف الحالي: {settings?.exchangeRate || '...'} د.ل</span>
                    </div>
                    <Button onClick={() => setIsBulkAddOpen(true)} className="bg-green-600 hover:bg-green-700 gap-2">
                        <Upload className="w-4 h-4" />
                        تعبئة المخزون
                    </Button>
                    <Button onClick={handleAddPackage} className="gap-2">
                        <Plus className="w-4 h-4" />
                        إضافة خدمة جديدة
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-[400px]">
                    <TabsTrigger value="packages">تعريف الخدمات والأسعار</TabsTrigger>
                    <TabsTrigger value="inventory">المخزون</TabsTrigger>
                </TabsList>

                <TabsContent value="packages" className="mt-6">
                    <div className="grid grid-cols-1 gap-6">
                        {packages.map(pkg => (
                            <UICard key={pkg.id} className="overflow-hidden border-t-4 border-t-primary">
                                <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {pkg.image && <img src={pkg.image} alt={pkg.service} className="w-12 h-12 rounded-lg object-cover border" />}
                                        <div>
                                            <CardTitle className="text-xl">{pkg.service}</CardTitle>
                                            <CardDescription className="flex gap-2 mt-1">
                                                <Badge variant="secondary">{pkg.category}</Badge>
                                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">هامش كاش: {pkg.profitMarginCash}%</Badge>
                                                <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">هامش مصرف: {pkg.profitMarginBank}%</Badge>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditPackage(pkg)}>
                                            <Edit className="w-4 h-4 ml-2" />
                                            تعديل الأسعار
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeletePackage(pkg.id)} className="text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>اسم الفئة (النوع)</TableHead>
                                                <TableHead>التكلفة ($)</TableHead>
                                                <TableHead>سعر الكاش (د.ل)</TableHead>
                                                <TableHead>سعر المصرف (د.ل)</TableHead>
                                                <TableHead>المخزون</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pkg.variants?.map((v, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-bold">{v.name}</TableCell>
                                                    <TableCell>{v.costUSD} $</TableCell>
                                                    <TableCell className="font-bold text-green-700">
                                                        {calculatePrice(v.costUSD, pkg.profitMarginCash)}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-blue-700">
                                                        {calculatePrice(v.costUSD, pkg.profitMarginBank)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStockCount(pkg.service, v.name) > 0 ? "default" : "destructive"}>
                                                            {getStockCount(pkg.service, v.name)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </UICard>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الخدمة</TableHead>
                                    <TableHead className="text-right">الفئة</TableHead>
                                    <TableHead className="text-right">الكود</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                                    <TableHead className="text-right">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cards.slice(0, 50).map(card => (
                                    <TableRow key={card.id}>
                                        <TableCell>{card.service}</TableCell>
                                        <TableCell>{card.name}</TableCell>
                                        <TableCell className="font-mono">{card.code}</TableCell>
                                        <TableCell>
                                            <Badge variant={card.status === 'available' ? 'outline' : 'secondary'}>
                                                {card.status === 'available' ? 'متاح' : 'مباع'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(card.createdAt).toLocaleDateString('ar-LY')}</TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Service/Package Dialog */}
            <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
                <DialogContent className="max-w-3xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعريف خدمة وبطاقاتها</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label>اسم الخدمة (مثلاً: PUBG Mobile)</Label>
                            <Input
                                value={packageForm.service}
                                onChange={e => setPackageForm({ ...packageForm, service: e.target.value })}
                                placeholder="PUBG Mobile"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>القسم</Label>
                            <Select
                                value={packageForm.category}
                                onValueChange={v => setPackageForm({ ...packageForm, category: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Games">ألعاب</SelectItem>
                                    <SelectItem value="Apps">تطبيقات</SelectItem>
                                    <SelectItem value="GiftCards">بطاقات هدايا</SelectItem>
                                    <SelectItem value="Subscriptions">اشتراكات</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4 p-4 bg-slate-50 rounded-lg border">
                        <h4 className="font-bold text-sm mb-2 text-slate-700">هوامش الربح (تطبق على جميع الفئات)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-green-700">هامش الكاش (%)</Label>
                                <Input
                                    type="number"
                                    value={packageForm.profitMarginCash}
                                    onChange={e => setPackageForm({ ...packageForm, profitMarginCash: parseFloat(e.target.value) })}
                                    placeholder="5 (يعني 5%)"
                                    className="border-green-200 focus:border-green-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-blue-700">هامش المصرف (%)</Label>
                                <Input
                                    type="number"
                                    value={packageForm.profitMarginBank}
                                    onChange={e => setPackageForm({ ...packageForm, profitMarginBank: parseFloat(e.target.value) })}
                                    placeholder="10 (يعني 10%)"
                                    className="border-blue-200 focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-purple-700">هامش الرصيد (%)</Label>
                                <Input
                                    type="number"
                                    value={packageForm.profitMarginBalance}
                                    onChange={e => setPackageForm({ ...packageForm, profitMarginBalance: parseFloat(e.target.value) })}
                                    placeholder="8 (يعني 8%)"
                                    className="border-purple-200 focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <Label>صورة الخدمة (شعار)</Label>
                        <div className="flex gap-4 items-center">
                            <div className="relative w-20 h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                                {isUploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                ) : packageForm.image ? (
                                    <img src={packageForm.image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="cursor-pointer"
                                    disabled={isUploading}
                                />
                                <Input
                                    placeholder="أو رابط الصورة (URL) مباشر..."
                                    value={packageForm.image}
                                    onChange={e => setPackageForm({ ...packageForm, image: e.target.value })}
                                    disabled={isUploading}
                                />
                                <p className="text-xs text-muted-foreground">يتم الرفع تلقائياً إلى ImgBB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">فئات الشحن (Variants)</h3>
                            <Button size="sm" onClick={addVariant} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" /> إضافة فئة
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الاسم (مثلاً: 60 UC)</TableHead>
                                        <TableHead className="w-32">التكلفة ($)</TableHead>
                                        <TableHead className="w-32">سعر الكاش (تقريبي)</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packageForm.variants.map((variant) => (
                                        <TableRow key={variant.id}>
                                            <TableCell>
                                                <Input
                                                    value={variant.name}
                                                    onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                                    placeholder="مثال: 60 UC"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={variant.costUSD}
                                                    onChange={e => updateVariant(variant.id, 'costUSD', parseFloat(e.target.value))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="bg-slate-50 text-center text-sm">
                                                {calculatePrice(variant.costUSD, packageForm.profitMarginCash)} د.ل
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" onClick={() => removeVariant(variant.id)} className="h-8 w-8 text-destructive">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button onClick={handleSubmitPackage} className="w-full">حفظ التغييرات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Add Dialog */}
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعبئة المخزون (Bulk Add)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>الخدمة</Label>
                            <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                                <SelectTrigger><SelectValue placeholder="اختر الخدمة..." /></SelectTrigger>
                                <SelectContent>
                                    {packages.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.service}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>الفئة</Label>
                            <Select value={selectedVariantId} onValueChange={setSelectedVariantId} disabled={!selectedPackageId}>
                                <SelectTrigger><SelectValue placeholder="اختر الفئة..." /></SelectTrigger>
                                <SelectContent>
                                    {packages.find(p => p.id === selectedPackageId)?.variants.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>الأكواد</Label>
                            <Textarea
                                rows={8}
                                placeholder="لصق الأكواد هنا..."
                                value={bulkCodes}
                                onChange={e => setBulkCodes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleBulkSubmit} disabled={!selectedVariantId || !bulkCodes}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
