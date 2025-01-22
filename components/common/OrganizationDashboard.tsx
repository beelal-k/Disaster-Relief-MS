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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Map from './Map';
import { Clock, MapPin, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';

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
    distance?: number; // Distance from organization
    eta?: number; // Estimated time of arrival in minutes
}

interface Resource {
    _id: string;
    type: string;
    quantity: number;
    location: {
        lat: number;
        lng: number;
    };
    status: 'available' | 'in-transit' | 'depleted';
    organization: {
        name: string;
    };
    createdAt: string;
}

export default function OrganizationDashboard({ organizationId }: { organizationId: string }) {
    const { toast } = useToast();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
    const [estimatedTime, setEstimatedTime] = useState('');

    const [filters, setFilters] = useState({
        type: 'all',
        urgency: 'all',
        status: 'all',
        distance: 'all', // '10km', '25km', '50km', 'all'
    });

    useEffect(() => {
        fetchData();
    }, [organizationId]);

    async function fetchData() {
        try {
            const [needsRes, resourcesRes] = await Promise.all([
                fetch('/api/needs'),
                fetch(`/api/organizations/${organizationId}/resources`)
            ]);

            const needsData = await needsRes.json();
            const resourcesData = await resourcesRes.json();

            // Calculate distance for each need from the organization's location
            const needsWithDistance = needsData.map((need: Need) => ({
                ...need,
                distance: calculateDistance(need.location, resourcesData[0]?.location || { lat: 0, lng: 0 })
            }));

            setNeeds(needsWithDistance);
            setResources(resourcesData);
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

    function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) {
        // Simple distance calculation (you might want to use a more accurate formula)
        const R = 6371; // Earth's radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async function handleDispatchResource() {
        if (!selectedNeed || !estimatedTime) return;

        try {
            const response = await fetch(`/api/needs/${selectedNeed._id}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    eta: parseInt(estimatedTime)
                }),
            });

            if (!response.ok) throw new Error('Failed to dispatch resource');

            toast({
                title: 'Resource Dispatched',
                description: `Resources have been dispatched to address the need. ETA: ${estimatedTime} minutes.`,
            });

            setDispatchDialogOpen(false);
            setSelectedNeed(null);
            setEstimatedTime('');
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to dispatch resource.',
                variant: 'destructive',
            });
        }
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
            <div className="min-w-[200px] p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{need.type.toUpperCase()}</h3>
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
                    <MapPin className="w-4 h-4 mr-1" />
                    {need.distance?.toFixed(1)}km away
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(need.createdAt).toLocaleDateString()}
                </div>
                <Button
                    className="w-full"
                    onClick={() => {
                        setSelectedNeed(need);
                        setDispatchDialogOpen(true);
                    }}
                    disabled={need.status !== 'pending'}
                >
                    Dispatch Resources
                </Button>
            </div>
        ),
        type: 'need' as const,
    }));

    const resourceMarkers = resources.map((resource) => ({
        position: [resource.location.lat, resource.location.lng] as [number, number],
        popup: (
            <div className="min-w-[200px] p-4">
                <h3 className="font-bold text-lg mb-2">{resource.type.toUpperCase()}</h3>
                <p className="text-sm mb-2">Quantity: {resource.quantity}</p>
                <Badge variant={
                    resource.status === 'available' ? 'secondary' :
                        resource.status === 'in-transit' ? 'default' :
                            'destructive'
                }>
                    {resource.status}
                </Badge>
            </div>
        ),
        type: 'resource' as const,
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <h3 className="font-semibold mb-2">Type</h3>
                    <Select
                        value={filters.type}
                        onValueChange={(value) => setFilters({ ...filters, type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="shelter">Shelter</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="water">Water</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </Card>

                <Card className="p-4">
                    <h3 className="font-semibold mb-2">Urgency</h3>
                    <Select
                        value={filters.urgency}
                        onValueChange={(value) => setFilters({ ...filters, urgency: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by urgency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Urgencies</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </Card>

                <Card className="p-4">
                    <h3 className="font-semibold mb-2">Status</h3>
                    <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </Card>

                <Card className="p-4">
                    <h3 className="font-semibold mb-2">Distance</h3>
                    <Select
                        value={filters.distance}
                        onValueChange={(value) => setFilters({ ...filters, distance: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by distance" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Distance</SelectItem>
                            <SelectItem value="10">Within 10km</SelectItem>
                            <SelectItem value="25">Within 25km</SelectItem>
                            <SelectItem value="50">Within 50km</SelectItem>
                        </SelectContent>
                    </Select>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
                <Card className="p-6">
                    <Map
                        className="h-[600px]"
                        markers={[...needMarkers, ...resourceMarkers]}
                        interactive={true}
                    />
                </Card>

                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">Needs Overview</h3>
                                <p className="text-sm text-gray-500">
                                    {filteredNeeds.length} needs in selected area
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {filteredNeeds.filter(n => n.urgency === 'high').length} High
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {filteredNeeds.filter(n => n.status === 'resolved').length} Resolved
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <ScrollArea className="h-[450px]">
                            <div className="space-y-4">
                                {filteredNeeds.map((need) => (
                                    <Card key={need._id} className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold">{need.type}</h4>
                                                <p className="text-sm text-gray-600">{need.description}</p>
                                            </div>
                                            <Badge variant={
                                                need.urgency === 'high' ? 'destructive' :
                                                    need.urgency === 'medium' ? 'default' :
                                                        'secondary'
                                            }>
                                                {need.urgency}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {need.distance?.toFixed(1)}km away
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {new Date(need.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {need.status === 'pending' && (
                                            <Button
                                                className="w-full mt-3"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedNeed(need);
                                                    setDispatchDialogOpen(true);
                                                }}
                                            >
                                                Dispatch Resources
                                            </Button>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            </div>

            <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dispatch Resources</DialogTitle>
                        <DialogDescription>
                            Enter the estimated time of arrival for the resources to reach the location.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Time of Arrival (minutes)</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Enter ETA in minutes"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                />
                                <Timer className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        <div className="bg-secondary p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Need Details</h4>
                            <p className="text-sm mb-2">{selectedNeed?.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {selectedNeed?.distance?.toFixed(1)}km away
                                </div>
                                <Badge variant={
                                    selectedNeed?.urgency === 'high' ? 'destructive' :
                                        selectedNeed?.urgency === 'medium' ? 'default' :
                                            'secondary'
                                }>
                                    {selectedNeed?.urgency}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDispatchResource} disabled={!estimatedTime}>
                            Confirm Dispatch
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 