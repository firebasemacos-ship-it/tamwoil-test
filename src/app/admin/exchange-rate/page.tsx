'use client';

import { useState, useEffect } from 'react';
import { getAppSettings, updateAppSettings } from '@/lib/actions';
import type { AppSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Save, DollarSign, CreditCard, Package } from 'lucide-react';

export default function ExchangeRatePage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getAppSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error loading settings:', error);
            toast({
                title: 'خطأ',
                description: 'فشل تحميل الإعدادات',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formData = new FormData(e.currentTarget);
            const updates: Partial<AppSettings> = {
                exchangeRate: parseFloat(formData.get('exchangeRate') as string),
                pricePerKiloLYD: parseFloat(formData.get('pricePerKiloLYD') as string),
                pricePerKiloUSD: parseFloat(formData.get('pricePerKiloUSD') as string),
                cardsExchangeRateCash: parseFloat(formData.get('cardsExchangeRateCash') as string),
                cardsExchangeRateBank: parseFloat(formData.get('cardsExchangeRateBank') as string),
                cardsExchangeRateBalance: parseFloat(formData.get('cardsExchangeRateBalance') as string),
                productsExchangeRateCash: parseFloat(formData.get('productsExchangeRateCash') as string),
                productsExchangeRateBank: parseFloat(formData.get('productsExchangeRateBank') as string),
                productsExchangeRateBalance: parseFloat(formData.get('productsExchangeRateBalance') as string),
            };

            const success = await updateAppSettings(updates);

            if (success) {
                toast({
                    title: 'تم الحفظ',
                    description: 'تم تحديث الإعدادات بنجاح',
                });
                await loadSettings();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'خطأ',
                description: 'فشل حفظ الإعدادات',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">أسعار الصرف والشحن</h1>
                <p className="text-muted-foreground">
                    إدارة أسعار الصرف للطلبات والبطاقات والمنتجات
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Exchange Rates */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            <div>
                                <CardTitle>سعر الصرف الأساسي</CardTitle>
                                <CardDescription>للطلبات والشحنات العادية</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="exchangeRate">سعر صرف الدولار</Label>
                                <Input
                                    id="exchangeRate"
                                    name="exchangeRate"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.exchangeRate}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">1 USD = ? LYD</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pricePerKiloUSD">سعر الكيلو (دولار)</Label>
                                <Input
                                    id="pricePerKiloUSD"
                                    name="pricePerKiloUSD"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.pricePerKiloUSD}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pricePerKiloLYD">سعر الكيلو (دينار)</Label>
                                <Input
                                    id="pricePerKiloLYD"
                                    name="pricePerKiloLYD"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.pricePerKiloLYD}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Cards Exchange Rates */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <div>
                                <CardTitle>أسعار صرف البطاقات</CardTitle>
                                <CardDescription>أسعار صرف خاصة بشراء البطاقات</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardsExchangeRateCash">سعر الكاش</Label>
                                <Input
                                    id="cardsExchangeRateCash"
                                    name="cardsExchangeRateCash"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.cardsExchangeRateCash}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع نقداً</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardsExchangeRateBank">سعر التحويل المصرفي</Label>
                                <Input
                                    id="cardsExchangeRateBank"
                                    name="cardsExchangeRateBank"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.cardsExchangeRateBank}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع بتحويل مصرفي</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardsExchangeRateBalance">سعر الرصيد</Label>
                                <Input
                                    id="cardsExchangeRateBalance"
                                    name="cardsExchangeRateBalance"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.cardsExchangeRateBalance}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع من الرصيد</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Products Exchange Rates */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            <div>
                                <CardTitle>أسعار صرف المنتجات</CardTitle>
                                <CardDescription>أسعار صرف خاصة بشراء المنتجات</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="productsExchangeRateCash">سعر الكاش</Label>
                                <Input
                                    id="productsExchangeRateCash"
                                    name="productsExchangeRateCash"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.productsExchangeRateCash}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع نقداً</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productsExchangeRateBank">سعر التحويل المصرفي</Label>
                                <Input
                                    id="productsExchangeRateBank"
                                    name="productsExchangeRateBank"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.productsExchangeRateBank}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع بتحويل مصرفي</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productsExchangeRateBalance">سعر الرصيد</Label>
                                <Input
                                    id="productsExchangeRateBalance"
                                    name="productsExchangeRateBalance"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings.productsExchangeRateBalance}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">عند الدفع من الرصيد</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        <Save className="h-4 w-4 ml-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
