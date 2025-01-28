'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/api';
import Map from '@/components/common/Map';
import { User, Building2, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface Need {
    _id: string;
    type: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    location: {
        lat: number;
        lng: number;
    };
    status: 'pending' | 'in-progress' | 'resolved';
    createdBy: {
        email: string;
        role: string;
    };
    assignedTo?: {
        name: string;
        contactEmail: string;
    };
    eta?: number;
    createdAt: string;
}

interface UserData {
    _id: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Organization {
    _id: string;
    name: string;
    description: string;
    contactEmail: string;
    members: { email: string; role: string; }[];
    createdAt: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [needs, setNeeds] = useState<Need[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'admin') {
            router.push('/');
            return;
        }
        fetchData();
    }, [router]);

    async function fetchData() {
        try {
            const [needsRes, usersRes, orgsRes] = await Promise.all([
                fetch('/api/needs'),
                fetch('/api/users'),
                fetch('/api/organizations')
            ]);

            const [needsData, usersData, orgsData] = await Promise.all([
                needsRes.json(),
                usersRes.json(),
                orgsRes.json()
            ]);

            setNeeds(needsData);
            setUsers(usersData);
            setOrganizations(orgsData);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch dashboard data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const needMarkers = needs.map((need) => ({
        position: [need.location.lat, need.location.lng] as [number, number],
        popup: (
            <div className="min-w-[200px] p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{need.type}</h3>
                    <Badge variant={
                        need.urgency === 'high' ? 'destructive' :
                            need.urgency === 'medium' ? 'default' :
                                'secondary'
                    }>
                        {need.urgency}
                    </Badge>
                </div>
                <p className="text-sm mb-2">{need.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(need.createdAt).toLocaleDateString()}
                </div>
                <Button
                    className="w-full"
                    onClick={() => setSelectedNeed(need)}
                >
                    View Details
                </Button>
            </div>
        ),
    }));

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div>Admin</div>
        </Layout>
    );
} 