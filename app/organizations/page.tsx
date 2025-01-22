'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api, getCurrentUser } from '@/lib/api';
import OrganizationForm from '@/components/forms/OrganizationForm';
import {
    Globe,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    Trash2,
    Users
} from 'lucide-react';
import { User } from '@/types';
import Layout from '@/components/common/Layout';

interface Organization {
    _id: string;
    name: string;
    description: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    website?: string;
    admin: User;
    members: User[];
}

export default function OrganizationsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [userOrganization, setUserOrganization] = useState<Organization | null>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.push('/login');
        } else {
            setUser(currentUser);
            fetchOrganizations();
        }
        setLoading(false);
    }, [router]);

    async function fetchOrganizations() {
        try {
            const response = await fetch(`/api/organizations${searchQuery ? `?search=${searchQuery}` : ''}`);
            const data = await response.json();
            setOrganizations(data);

            // Find user's organization if they are an admin of one
            const userOrg = data.find((org: Organization) => org.admin._id === user?.id);
            setUserOrganization(userOrg);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch organizations.',
                variant: 'destructive',
            });
        }
    }

    async function handleCreateOrganization(data: any) {
        try {
            const response = await api.post('/organizations', data);

            if (!response) {
                throw new Error('Failed to create organization');
            }

            // If user is an individual, update their role to worker
            if (user?.role === 'individual') {
                await api.patch(`/users/${user.id}`, { role: 'worker' });
                // Update local user data
                const updatedUser = { ...user, role: 'worker' };
                localStorage.setItem('token', response.data.token);
                setUser(updatedUser);
            }

            await fetchOrganizations();
            setShowCreateDialog(false);
            toast({
                title: 'Success',
                description: 'Organization created successfully.',
            });
        } catch (error: any) {
            throw error;
        }
    }

    async function handleUpdateOrganization(data: any) {
        if (!selectedOrganization) return;

        try {
            const response = await api.patch(`/organizations/${selectedOrganization._id}`, data);

            if (!response) {
                throw new Error('Failed to update organization');
            }

            await fetchOrganizations();
            setSelectedOrganization(null);
            toast({
                title: 'Success',
                description: 'Organization updated successfully.',
            });
        } catch (error: any) {
            throw error;
        }
    }

    async function handleDeleteOrganization(organizationId: string) {
        if (!confirm('Are you sure you want to delete this organization?')) return;

        try {
            const response = await api.delete(`/organizations/${organizationId}`);

            if (!response) {
                throw new Error('Failed to delete organization');
            }

            toast({
                title: 'Organization deleted',
                description: 'The organization has been deleted successfully.',
            });

            await fetchOrganizations();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete organization.',
                variant: 'destructive',
            });
        }
    }

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Organizations</h1>
                        <p className="text-gray-400">Manage disaster relief organizations</p>
                    </div>
                    {!userOrganization && user?.role !== 'admin' && (
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Organization
                        </Button>
                    )}
                </div>

                <Card className="p-4 bg-white/5 border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search organizations..."
                            className="pl-10 bg-transparent border-gray-700 text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOrganizations()}
                        />
                    </div>
                </Card>

                <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {organizations.map((org) => (
                            <Card key={org._id} className="p-6 bg-white/5 border-gray-800">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{org.name}</h3>
                                        <p className="text-gray-400 mt-1">{org.description}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-gray-300">
                                            <Mail className="w-4 h-4 mr-2" />
                                            {org.contactEmail}
                                        </div>
                                        {org.contactPhone && (
                                            <div className="flex items-center text-gray-300">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {org.contactPhone}
                                            </div>
                                        )}
                                        {org.address && (
                                            <div className="flex items-center text-gray-300">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {org.address}
                                            </div>
                                        )}
                                        {org.website && (
                                            <div className="flex items-center text-gray-300">
                                                <Globe className="w-4 h-4 mr-2" />
                                                {org.website}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                        <div className="flex items-center text-gray-300">
                                            <Users className="w-4 h-4 mr-2" />
                                            {org.members.length} members
                                        </div>
                                        {(user?.id === org.admin._id || user?.role === 'admin') && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedOrganization(org)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteOrganization(org._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Organization</DialogTitle>
                        </DialogHeader>
                        <OrganizationForm onSubmit={handleCreateOrganization} />
                    </DialogContent>
                </Dialog>

                <Dialog open={!!selectedOrganization} onOpenChange={() => setSelectedOrganization(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Organization</DialogTitle>
                        </DialogHeader>
                        {selectedOrganization && (
                            <OrganizationForm
                                onSubmit={handleUpdateOrganization}
                                organization={selectedOrganization}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
} 