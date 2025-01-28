'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/common/Map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, X, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/api';
import Layout from '@/components/common/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { capitalizeWords } from '@/lib/utils';

interface Need {
    _id: string;
    type: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    location: {
        lat: number;
        lng: number;
    };
    status: 'pending' | 'resources-dispatched' | 'completed';
    createdBy: {
        email: string;
    };
    requiredQuantity: number;
    fulfilledQuantity: number;
    dispatches: Array<{
        _id: string;
        eta: number;
        status: 'dispatched' | 'reached';
        resourceAmount: number;
        dispatchedAt: string;
    }>;
    createdAt: string;
}

export default function AdminNeedsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [needs, setNeeds] = useState<Need[]>([]);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [showDispatchDialog, setShowDispatchDialog] = useState(false);
    const [eta, setEta] = useState('');
    const [resourceAmount, setResourceAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function checkAndFetchData() {
            try {
                // Check if user is admin
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

                // Fetch all needs that are not completed
                const needsRes = await api.get('/needs?status=active');
                setNeeds(needsRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load needs data.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        }

        checkAndFetchData();
    }, [router]);

    const handleDispatchResources = async (e: any) => {
        e.preventDefault();
        if (!selectedNeed || !eta || !resourceAmount || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post(`/needs/${selectedNeed._id}/dispatch`, {
                eta: parseInt(eta),
                resourceAmount: parseInt(resourceAmount)
            });

            toast({
                title: 'Success',
                description: 'Resources dispatched successfully.',
            });

            // Reset all states
            setShowDispatchDialog(false);
            setSelectedNeed(null);
            setEta('');
            setResourceAmount('');

            // Refresh needs data
            const needsRes = await api.get('/needs?status=active');
            setNeeds(needsRes.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to dispatch resources.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsReached = async (needId: string, dispatchId: string) => {
        try {
            await api.patch(`/needs/${needId}/dispatch`, {
                dispatchId
            });

            toast({
                title: 'Success',
                description: 'Dispatch marked as reached.',
            });

            // Refresh needs data
            const needsRes = await api.get('/needs?status=active');
            setNeeds(needsRes.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to mark dispatch as reached.',
                variant: 'destructive',
            });
        }
    };

    const needMarkers = needs.map((need) => ({
        position: [need.location.lat, need.location.lng] as [number, number],
        popup: (
            <div className="min-w-[200px]  p-2 px-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{capitalizeWords(need.type)}</h3>
                    <Badge variant={
                        need.urgency === 'high' ? 'destructive' :
                            need.urgency === 'medium' ? 'default' :
                                'secondary'
                    }>
                        {capitalizeWords(need.urgency)}
                    </Badge>
                </div>
                <p className="text-sm mb-2">{need.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(need.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                    Required: {need.requiredQuantity}<br />
                    Fulfilled: {need.fulfilledQuantity}
                </div>
                <Button
                    className="w-full"
                    onClick={() => setSelectedNeed(need)}
                >
                    View Details
                </Button>
            </div>
        ),
        type: 'need' as const,
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
            <Map
                className="absolute top-0 left-0 w-screen h-screen"
                markers={needMarkers}
                interactive={true}
            />

            {/* Overlay Content */}
            <div className="relative z-[1000] p-6">
                {selectedNeed && (
                    <Card className="w-[30vw] ml-24 border border-red-500 z-[1000] p-5 pt-2 bg-black/70 backdrop-blur-sm border-neutral-800">
                        <div className="flex justify-end mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-transparent"
                                onClick={() => setSelectedNeed(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedNeed.type}
                                    </h3>
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
                                    <h4 className="text-sm font-medium text-gray-400">Status</h4>
                                    <Badge className="mt-1" variant={
                                        selectedNeed.status === 'pending' ? 'default' :
                                            selectedNeed.status === 'resources-dispatched' ? 'secondary' :
                                                'outline'
                                    }>
                                        {capitalizeWords(selectedNeed.status)}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">Created By</h4>
                                    <p className="text-white mt-1">{selectedNeed.createdBy.email}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">Quantities</h4>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-white">
                                            Required: {selectedNeed.requiredQuantity}
                                        </p>
                                        <p className="text-white">
                                            Fulfilled: {selectedNeed.fulfilledQuantity}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">Created At</h4>
                                    <p className="text-white mt-1">
                                        {new Date(selectedNeed.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {selectedNeed.status === 'pending' && (
                                    <Button
                                        className="w-full"
                                        onClick={() => setShowDispatchDialog(true)}
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Dispatch Resources
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Dispatch Dialog */}
            <Dialog
                open={showDispatchDialog}
                onOpenChange={setShowDispatchDialog}
                modal={true}
            >
                <DialogContent
                    className='z-[2000] ml-24 bg-neutral-800 border-neutral-700 text-white'
                    onPointerDownOutside={() => setShowDispatchDialog(false)}
                >
                    <div className="flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle>Dispatch Resources</DialogTitle>
                            <DialogDescription>
                                Enter the dispatch details for this need.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Resource Amount (Required: {selectedNeed?.requiredQuantity})
                            </label>
                            <Input
                                type="number"
                                value={resourceAmount}
                                onChange={(e) => setResourceAmount(e.target.value)}
                                className="bg-neutral-700 border-neutral-600"
                                min="1"
                                max={selectedNeed?.requiredQuantity}
                                placeholder="Enter amount to dispatch"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Estimated Time of Arrival (minutes)
                            </label>
                            <Input
                                type="number"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                className="bg-neutral-700 border-neutral-600"
                                min="1"
                                placeholder="Enter ETA in minutes"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={(e) => handleDispatchResources(e)}
                            disabled={!eta || !resourceAmount || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Dispatching...
                                </>
                            ) : (
                                'Confirm Dispatch'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
