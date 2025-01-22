'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Building2,
    Users,
    LogOut,
    Map,
    AlertTriangle,
    Package
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.push('/login');
        } else {
            setUser(currentUser);
        }
    }, [router]);

    const isAdmin = user?.role === 'admin';
    const isOrganization = user?.role === 'organization' || user?.role === 'worker';

    const sidebarItems = [
        {
            title: 'Dashboard',
            href: '/',
            icon: LayoutDashboard,
            show: true
        },
        {
            title: 'Organizations',
            href: '/organizations',
            icon: Building2,
            show: !isOrganization
        },
        {
            title: 'Organization Dashboard',
            href: '/organization-dashboard',
            icon: Map,
            show: isOrganization
        },
        {
            title: 'Resources',
            href: '/resources',
            icon: Package,
            show: isOrganization
        },
        {
            title: 'Needs',
            href: '/needs',
            icon: AlertTriangle,
            show: true
        },
        {
            title: 'Users',
            href: '/admin/users',
            icon: Users,
            show: isAdmin
        }
    ].filter(item => item.show);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <div className="flex">
                {/* Sidebar */}
                <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DRMS</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Disaster Relief Management</p>
                        </div>
                        <ScrollArea className="flex-1 px-4">
                            <div className="space-y-2">
                                {sidebarItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        variant={pathname === item.href ? 'default' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-2',
                                            pathname === item.href && 'bg-gray-100 dark:bg-gray-800'
                                        )}
                                        onClick={() => router.push(item.href)}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.title}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Main content */}
                <div className="flex-1 ml-64">
                    <main className="p-8">{children}</main>
                </div>
            </div>
        </div>
    );
} 