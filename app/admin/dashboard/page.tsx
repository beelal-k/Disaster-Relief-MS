'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/common/Map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
    };
    requiredQuantity: number;
    fulfilledQuantity: number;
    createdAt: string;
}

interface Stock {
    type: string;
    quantity: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [needs, setNeeds] = useState<Need[]>([]);
    const [stock, setStock] = useState<Stock[]>([]);
    const [showAddStockDialog, setShowAddStockDialog] = useState(false);
    const [newStock, setNewStock] = useState({
        type: '',
        quantity: '',
    });

    useEffect(() => {
        async function checkAndFetchData() {
            try {
                // Check if user is admin
                const userRes = await api.get('/auth/me');
                if (userRes.data.role !== 'admin') {
                    toast({
                        title: 'Unauthorized',
                        description: 'Only admins can access this page.',
                        variant: 'destructive',
                    });
                    router.push('/');
                    return;
                }

                // Fetch needs
                const needsRes = await api.get('/needs');
                setNeeds(needsRes.data);

                // Fetch stock
                const stockRes = await api.get('/stock');
                setStock(stockRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        }

        checkAndFetchData();
    }, [router]);

    const handleAddStock = async () => {
        if (!newStock.type || !newStock.quantity) return;

        try {
            const res = await api.post('/stock', {
                type: newStock.type,
                quantity: parseInt(newStock.quantity),
            });

            setStock(res.data);
            setShowAddStockDialog(false);
            setNewStock({ type: '', quantity: '' });

            toast({
                title: 'Success',
                description: 'Stock added successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add stock.',
                variant: 'destructive',
            });
        }
    };

    const handleFulfillNeed = async (needId: string, quantity: number) => {
        try {
            const res = await api.patch(`/needs/${needId}/fulfill`, {
                quantity
            });

            // Update needs list with the updated need
            setNeeds(needs.map(need =>
                need._id === needId ? res.data : need
            ));

            toast({
                title: 'Success',
                description: 'Need fulfilled successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fulfill need.',
                variant: 'destructive',
            });
        }
    };

    const needMarkers = needs.map((need) => ({
        position: [need.location.lat, need.location.lng] as [number, number],
        popup: (
            <div className="min-w-[200px]">
                <h3 className="font-bold text-red-600">{need.type.toUpperCase()}</h3>
                <p className="text-sm mt-2">{need.description}</p>
                <div className="mt-2">
                    <span className={cn(
                        "text-xs font-semibold",
                        need.urgency === 'high' ? 'text-red-600' :
                            need.urgency === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                    )}>
                        {need.urgency.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                        Required: {need.requiredQuantity}<br />
                        Fulfilled: {need.fulfilledQuantity}
                    </div>
                </div>
                {need.status === 'pending' && (
                    <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handleFulfillNeed(need._id, 1)}
                    >
                        Send Resources
                    </Button>
                )}
            </div>
        ),
        type: 'need' as const,
    }));

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-neutral-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="h-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-neutral-400">
                        Manage resources and view needs.
                    </p>
                </div>
                <Button onClick={() => setShowAddStockDialog(true)}>
                    Add Stock
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
                <Card className="p-6 bg-neutral-800/50 border-neutral-700">
                    <Map
                        className="h-[600px]"
                        markers={needMarkers}
                        interactive={true}
                        zoom={12}
                    />
                </Card>

                <div className="space-y-6">
                    <Card className="p-4 bg-neutral-800/50 border-neutral-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Stock</h2>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {stock.map((item, index) => (
                                    <Card key={index} className="p-4 bg-neutral-700/50 border-neutral-600">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {item.type}
                                                </h3>
                                                <p className="text-sm text-neutral-300">
                                                    Quantity: {item.quantity}
                                                </p>
                                            </div>
                                            <Badge>
                                                Available
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>

                    <Card className="p-4 bg-neutral-800/50 border-neutral-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Active Needs</h2>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {needs.filter(need => need.status === 'pending').map((need) => (
                                    <Card key={need._id} className="p-4 bg-neutral-700/50 border-neutral-600">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-white">{need.type}</h3>
                                            <Badge variant={
                                                need.urgency === 'high' ? 'destructive' :
                                                    need.urgency === 'medium' ? 'default' :
                                                        'secondary'
                                            }>
                                                {need.urgency}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-neutral-300 mt-2">{need.description}</p>
                                        <div className="mt-2 text-xs text-neutral-400">
                                            Required: {need.requiredQuantity}<br />
                                            Fulfilled: {need.fulfilledQuantity}
                                        </div>
                                        {need.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                className="mt-2 w-full"
                                                onClick={() => handleFulfillNeed(need._id, 1)}
                                            >
                                                Send Resources
                                            </Button>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            </div>

            <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
                <DialogContent className='bg-neutral-800/90 border-neutral-700 text-white'>
                    <DialogHeader>
                        <DialogTitle>Add Stock</DialogTitle>
                        <DialogDescription>
                            Add new stock items.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={newStock.type}
                                onValueChange={(value) => setNewStock({ ...newStock, type: value })}
                            >
                                <SelectTrigger className="bg-neutral-700 border-neutral-600">
                                    <SelectValue placeholder="Select stock type" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="water">Water</SelectItem>
                                    <SelectItem value="medical">Medical</SelectItem>
                                    <SelectItem value="shelter">Shelter</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input
                                type="number"
                                min="1"
                                value={newStock.quantity}
                                onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                                className="bg-neutral-700 border-neutral-600"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleAddStock}
                            disabled={!newStock.type || !newStock.quantity}
                        >
                            Add Stock
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 