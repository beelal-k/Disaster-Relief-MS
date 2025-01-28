'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/common/Layout';
import DispatchesTable from '@/components/tables/DispatchesTable';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function AdminDispatchesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dispatches, setDispatches] = useState([]);

    const fetchDispatches = async () => {
        try {
            const res = await api.get('/dispatches');
            setDispatches(res.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch dispatches.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteDispatch = async (id: string) => {
        try {
            const res = await api.delete(`/dispatches/${id}`);
            toast({
                title: 'Success',
                description: 'Dispatch deleted successfully.',
            });
            await fetchDispatches();
            toast({
                title: "Success",
                description: "Deleted dispatch successfully!"
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete dispatch.',
                variant: 'destructive',
            });
        }
    }

    useEffect(() => {
        async function checkAndFetchData() {
            try {
                const user = getCurrentUser();
                if (!user || user.role !== 'admin') {
                    toast({
                        title: 'Unauthorized',
                        description: 'Only admins can access this page.',
                        variant: 'destructive',
                    });
                    router.push('/');
                    return;
                }

                await fetchDispatches();
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load data.',
                    variant: 'destructive',
                });
            }
        }

        checkAndFetchData();
    }, [router]);

    if (loading) {
        return (
            <Layout className='ml-0 p-5'>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin" color='white' />
                </div>
            </Layout>
        );
    }

    return (
        <Layout className='ml-0 p-5'>
            <div className="w-full">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white">Dispatches</h1>
                    <p className="text-gray-400">Manage and track all resource dispatches</p>
                </div>

                <Card className="bg-white/10 backdrop-blur-sm text-white border-white/10">
                    <div className="p-6">
                        <DispatchesTable
                            dispatches={dispatches}
                            onUpdate={fetchDispatches}
                            onDelete={deleteDispatch}
                        />
                    </div>
                </Card>
            </div>
        </Layout>
    );
} 