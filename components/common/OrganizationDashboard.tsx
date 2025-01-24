'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Map from './Map';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    createdAt: string;
    distance?: number;
}

interface Organization {
    _id: string;
    name: string;
    address: string;
    location?: {
        lat: number;
        lng: number;
    };
}

export default function OrganizationDashboard() {
    const { toast } = useToast();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        urgency: 'all',
        status: 'pending', // Default to pending needs
        distance: 'all',
    });
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [showDispatchDialog, setShowDispatchDialog] = useState(false);
    const [eta, setEta] = useState('');

    // Fetch organization and nearby needs
    async function fetchData() {
        try {
            setLoading(true);
            // Get user's organization
            const orgRes = await api.get('/organizations?userOrg=true');
            const userOrg = orgRes.data[0]; // Get first organization since user can only be in one
            setOrganization(userOrg);

            // Get needs based on organization's location
            const needsRes = await api.get('/needs');
            const needsWithDistance = needsRes.data.map((need: Need) => ({
                ...need,
                distance: calculateDistance(
                    userOrg.location?.lat || 0,
                    userOrg.location?.lng || 0,
                    need.location.lat,
                    need.location.lng
                )
            }));
            setNeeds(needsWithDistance);
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

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate distance between two points using Haversine formula
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    const filteredNeeds = needs.filter((need) => {
        if (filters.type !== 'all' && need.type !== filters.type) return false;
        if (filters.urgency !== 'all' && need.urgency !== filters.urgency) return false;
        if (filters.status !== 'all' && need.status !== filters.status) return false;
        if (filters.distance !== 'all') {
            const maxDistance = parseInt(filters.distance);
            if (need.distance && need.distance > maxDistance) return false;
        }
        return true;
    });

    const needMarkers = filteredNeeds.map((need) => ({
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
                    <span className="text-xs text-gray-500 ml-2">
                        {need.distance?.toFixed(1)} km away
                    </span>
                </div>
                <Button
                    className="w-full mt-4"
                    onClick={() => {
                        setSelectedNeed(need);
                        setShowDispatchDialog(true);
                    }}
                >
                    Dispatch Resources
                </Button>
            </div>
        ),
        type: 'need' as const,
    }));

    // Add organization marker
    const allMarkers = [
        ...needMarkers,
        ...(organization?.location ? [{
            position: [organization.location.lat, organization.location.lng] as [number, number],
            popup: (
                <div className="min-w-[200px]">
                    <h3 className="font-bold text-blue-600">{organization.name}</h3>
                    <p className="text-sm mt-2">{organization.address}</p>
                </div>
            ),
            type: 'resource' as const,
        }] : []),
    ];

    const handleDispatchResources = async () => {
        if (!selectedNeed || !organization) return;

        try {
            await api.post('/resources/dispatch', {
                needId: selectedNeed._id,
                organizationId: organization._id,
                eta: parseInt(eta),
            });

            toast({
                title: 'Success',
                description: 'Resources dispatched successfully.',
            });
            setShowDispatchDialog(false);
            fetchData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to dispatch resources.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="fixed inset-0 left-64">
            <Map
                className="w-full h-screen"
                markers={allMarkers}
                interactive={true}
                center={organization?.location ? [organization.location.lat, organization.location.lng] : undefined}
                zoom={12}
            />

            {/* Right Sidebar */}
            <div className="absolute top-0 right-0 h-screen w-96 bg-black/70 backdrop-blur-sm border-l border-neutral-800 text-white overflow-hidden flex flex-col">
                <div className="p-4 border-b border-neutral-800">
                    <h2 className="text-xl font-bold mb-4">Nearby Needs</h2>
                    <div className="space-y-4">
                        <div>
                            <Select
                                value={filters.type}
                                onValueChange={(value) => setFilters({ ...filters, type: value })}
                            >
                                <SelectTrigger className="text-white bg-neutral-800/90 border-neutral-700">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="shelter">Shelter</SelectItem>
                                    <SelectItem value="medical">Medical</SelectItem>
                                    <SelectItem value="water">Water</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select
                                value={filters.urgency}
                                onValueChange={(value) => setFilters({ ...filters, urgency: value })}
                            >
                                <SelectTrigger className="text-white bg-neutral-800/90 border-neutral-700">
                                    <SelectValue placeholder="Filter by urgency" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="all">All Urgencies</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select
                                value={filters.distance}
                                onValueChange={(value) => setFilters({ ...filters, distance: value })}
                            >
                                <SelectTrigger className="text-white bg-neutral-800/90 border-neutral-700">
                                    <SelectValue placeholder="Filter by distance" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="all">Any Distance</SelectItem>
                                    <SelectItem value="5">Within 5 km</SelectItem>
                                    <SelectItem value="10">Within 10 km</SelectItem>
                                    <SelectItem value="20">Within 20 km</SelectItem>
                                    <SelectItem value="50">Within 50 km</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {loading ? (
                            <p>Loading needs...</p>
                        ) : filteredNeeds.length === 0 ? (
                            <p>No needs found nearby.</p>
                        ) : (
                            filteredNeeds.map((need) => (
                                <Card key={need._id} className="p-4 bg-neutral-800/90 border-neutral-700 text-white">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold">{need.type}</h3>
                                        <Badge variant={
                                            need.urgency === 'high' ? 'destructive' :
                                                need.urgency === 'medium' ? 'default' :
                                                    'secondary'
                                        }>
                                            {need.urgency}
                                        </Badge>
                                    </div>
                                    <p className="text-sm mt-2">{need.description}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-xs text-neutral-400">
                                            {need.distance?.toFixed(1)} km away
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedNeed(need);
                                                setShowDispatchDialog(true);
                                            }}
                                        >
                                            Dispatch
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Dispatch Dialog */}
            <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
                <DialogContent className='bg-neutral-800/90 border-neutral-700 text-white'>
                    <DialogHeader>
                        <DialogTitle>Dispatch Resources</DialogTitle>
                        <DialogDescription>
                            Enter the estimated time of arrival for the resources.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Estimated Time of Arrival (minutes)
                            </label>
                            <input
                                type="number"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md"
                                min="1"
                                placeholder="Enter ETA in minutes"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleDispatchResources}
                            disabled={!eta}
                        >
                            Confirm Dispatch
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 