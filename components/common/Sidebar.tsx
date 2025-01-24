'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import {
    Home,
    Map,
    LogOut,
    Settings,
    LayoutDashboard,
} from 'lucide-react';

interface User {
    _id: string;
    email: string;
    role: 'user' | 'admin';
}

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    const routes = [
        {
            href: '/',
            icon: Home,
            title: 'Home',
        },
        {
            href: '/map',
            icon: Map,
            title: 'Map',
        },
        ...(user?.role === 'admin' ? [
            {
                href: '/admin/dashboard',
                icon: LayoutDashboard,
                title: 'Admin Dashboard',
            }
        ] : []),
        {
            href: '/settings',
            icon: Settings,
            title: 'Settings',
        },
    ];

    return (
        <div className="fixed left-0 top-0 h-screen w-64 bg-black/70 backdrop-blur-sm border-r border-neutral-800">
            <ScrollArea className="h-full w-full">
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-lg font-semibold text-white">
                            DRMS
                        </h2>
                        <div className="space-y-1">
                            {routes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                        pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                                    )}
                                >
                                    <div className="flex items-center flex-1">
                                        <route.icon className="h-5 w-5 mr-3" />
                                        {route.title}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {user && (
                        <div className="px-6">
                            <div className="rounded-lg bg-neutral-800/50 p-4">
                                <div className="flex items-center gap-x-2">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {user.role === 'admin' ? 'Administrator' : 'User'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
} 