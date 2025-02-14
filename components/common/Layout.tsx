'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Users,
    LogOut,
    AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Toaster } from '../ui/toaster';

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { logout } = useAuthStore();

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
            title: 'Users',
            href: '/admin/users',
            icon: Users,
            show: isAdmin
        },
        {
            title: 'Needs',
            href: '/admin/needs',
            icon: AlertTriangle,
            show: isAdmin
        },
        {
            title: 'Dispatches',
            href: '/admin/dispatches',
            icon: Users,
            show: isAdmin
        }
    ].filter(item => item.show);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen z-[1000] relative bg-[#1a1a1a]">
            <div className="flex">
                {/* Sidebar */}
                <div className="fixed left-0 top-0 h-screen w-64 bg-neutral-900 text-white border-r border-r-neutral-800">
                    <div className="flex flex-col h-full">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-white">DRMS</h1>
                            <p className="text-sm text-neutral-500">Disaster Relief Management</p>
                        </div>
                        <ScrollArea className="flex-1 px-4">
                            <div className="space-y-2">
                                {sidebarItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        variant={pathname === item.href ? 'default' : 'ghost'}
                                        className={cn(
                                            'w-full hover:bg-neutral-800 hover:text-white justify-start gap-2',
                                            pathname === item.href && 'bg-neutral-800'
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
                                className="w-full justify-start gap-2 hover:text-red-500 text-red-500 hover:bg-red-800/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Main content */}
                <div className={cn(`flex-1 ml-64`, className)}>
                    <main className="">{children}</main>
                </div>
            </div>
            <Toaster />
        </div>
    );
} 