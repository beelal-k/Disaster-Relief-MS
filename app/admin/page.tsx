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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400">Monitor system activity and manage users</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-white/5 border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Needs</p>
                                <h3 className="text-2xl font-bold text-white">{needs.length}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-white/5 border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <User className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Users</p>
                                <h3 className="text-2xl font-bold text-white">{users.length}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-white/5 border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Organizations</p>
                                <h3 className="text-2xl font-bold text-white">{organizations.length}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
                    <Card className="p-6 bg-white/5 border-gray-800">
                        <Map
                            className="h-[600px]"
                            markers={needMarkers}
                            interactive={true}
                        />
                    </Card>

                    {selectedNeed ? (
                        <Card className="p-6 bg-white/5 border-gray-800">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">{selectedNeed.type}</h3>
                                        <Badge variant={
                                            selectedNeed.urgency === 'high' ? 'destructive' :
                                                selectedNeed.urgency === 'medium' ? 'default' :
                                                    'secondary'
                                        }>
                                            {selectedNeed.urgency}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-300">{selectedNeed.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400">Created By</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p className="text-white">{selectedNeed.createdBy.email}</p>
                                            <Badge variant="outline">{selectedNeed.createdBy.role}</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400">Location</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <p className="text-white">
                                                {selectedNeed.location.lat.toFixed(6)}, {selectedNeed.location.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedNeed.assignedTo && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400">Assigned Organization</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-white">{selectedNeed.assignedTo.name}</p>
                                                    <p className="text-sm text-gray-400">{selectedNeed.assignedTo.contactEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedNeed.eta && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400">ETA</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <p className="text-white">{selectedNeed.eta} minutes</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-6 bg-white/5 border-gray-800">
                            <p className="text-gray-400 text-center">Select a need from the map to view details</p>
                        </Card>
                    )}
                </div>

                <Card className="bg-white/5 border-gray-800">
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="w-full bg-white/5">
                            <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
                            <TabsTrigger value="organizations" className="flex-1">Organizations</TabsTrigger>
                        </TabsList>
                        <TabsContent value="users">
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="text-white">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{user.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="organizations">
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {organizations.map((org) => (
                                            <TableRow key={org._id}>
                                                <TableCell className="text-white">{org.name}</TableCell>
                                                <TableCell className="text-gray-400">{org.contactEmail}</TableCell>
                                                <TableCell>{org.members.length}</TableCell>
                                                <TableCell className="text-gray-400">
                                                    {new Date(org.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </Layout>
    );
} 