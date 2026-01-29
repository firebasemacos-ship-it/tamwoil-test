'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateStoreVisibility } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Settings as SettingsIcon, Store } from 'lucide-react';

export default function SettingsPage() {
    const [storeEnabled, setStoreEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'store_enabled')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setStoreEnabled(data.setting_value === 'true');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: 'خطأ',
                description: 'فشل تحميل الإعدادات',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Get current manager ID from local storage
            const savedUser = localStorage.getItem('loggedInUser');
            if (!savedUser) {
                toast({
                    title: 'خطأ',
                    description: 'جلسة العمل انتهت، يرجى تسجيل الدخول مرة أخرى',
                    variant: 'destructive',
                });
                return;
            }

            const { id: managerId } = JSON.parse(savedUser);

            const success = await updateStoreVisibility(storeEnabled, managerId);

            if (!success) throw new Error('Failed to update settings');

            toast({
                title: 'تم الحفظ',
                description: `تم ${storeEnabled ? 'تفعيل' : 'تعطيل'} قسم المتجر بنجاح`,
            });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">إعدادات التطبيق</h1>
            </div>

            <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                    <div className="flex items-center gap-3">
                        <Store className="w-6 h-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl">قسم المتجر</CardTitle>
                            <CardDescription className="text-sm mt-1">
                                التحكم في ظهور قسم المتجر في التطبيق
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                        <div className="space-y-1">
                            <p className="font-semibold text-lg">تفعيل المتجر</p>
                            <p className="text-sm text-muted-foreground">
                                {storeEnabled
                                    ? '✅ قسم المتجر مفعّل ويظهر في التطبيق'
                                    : '❌ قسم المتجر معطّل ومخفي من التطبيق'}
                            </p>
                        </div>
                        <Switch
                            checked={storeEnabled}
                            onCheckedChange={setStoreEnabled}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>ملاحظة:</strong> عند {storeEnabled ? 'تفعيل' : 'تعطيل'} المتجر، سيتم تحديث
                            التطبيق فوراً لجميع المستخدمين.
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                        size="lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="ml-2 h-4 w-4" />
                                حفظ التغييرات
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
