'use client';

import React from 'react';
import { Home, Search, ClipboardList, Users, Settings } from 'lucide-react';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col font-sans text-foreground" dir="rtl">
            {/* Main Content Area */}
            <div className="flex-grow pb-24">
                {children}
            </div>

            {/* Persistent Bottom Navigation */}
            <MobileBottomNav items={navItems} />
        </div>
    );
}
