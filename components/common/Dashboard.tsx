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
import Map from './Map';
import { getNeedsAndResources } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
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
    createdAt: string;
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

export default function Dashboard() {
    const { toast } = useToast();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        urgency: 'all',
        status: 'all',
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const { needs, resources } = await getNeedsAndResources();
                setNeeds(needs);
                setResources(resources);
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
        fetchData();
    }, [toast]);

    const filteredNeeds = needs.filter((need) => {
        if (filters.type !== 'all' && need.type !== filters.type) return false;
        if (filters.urgency !== 'all' && need.urgency !== filters.urgency) return false;
        if (filters.status !== 'all' && need.status !== filters.status) return false;
        return true;
    });

    const filteredResources = resources.filter((resource) => {
        if (filters.type !== 'all' && resource.type !== filters.type) return false;
        if (filters.status !== 'all' && resource.status !== filters.status) return false;
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
                        {new Date(need.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        ),
        type: 'need' as const,
    }));

    const resourceMarkers = filteredResources.map((resource) => ({
        position: [resource.location.lat, resource.location.lng] as [number, number],
        popup: (
            <div className="min-w-[200px]">
                <h3 className="font-bold text-blue-600">{resource.type.toUpperCase()}</h3>
                <p className="text-sm mt-2">Quantity: {resource.quantity}</p>
                <div className="mt-2">
                    <span className={cn(
                        "text-xs font-semibold",
                        resource.status === 'available' ? 'text-green-600' :
                            resource.status === 'in-transit' ? 'text-yellow-600' :
                                'text-red-600'
                    )}>
                        {resource.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                        {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        ),
        type: 'resource' as const,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
                <Card className="p-4">
                    <Map
                        className="h-[600px]"
                        markers={[...needMarkers, ...resourceMarkers]}
                        interactive={true}
                    />
                </Card>

                <Card className="p-4">
                    <Tabs defaultValue="needs">
                        <TabsList className="w-full">
                            <TabsTrigger value="needs" className="flex-1">
                                Needs ({filteredNeeds.length})
                            </TabsTrigger>
                            <TabsTrigger value="resources" className="flex-1">
                                Resources ({filteredResources.length})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="needs">
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-4">
                                    {filteredNeeds.map((need) => (
                                        <Card key={need._id} className="p-4">
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
                                            <p className="text-sm text-gray-600 mt-2">{need.description}</p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {new Date(need.createdAt).toLocaleDateString()}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="resources">
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-4">
                                    {filteredResources.map((resource) => (
                                        <Card key={resource._id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold">{resource.type}</h3>
                                                <Badge variant={
                                                    resource.status === 'available' ? 'secondary' :
                                                        resource.status === 'in-transit' ? 'default' :
                                                            'destructive'
                                                }>
                                                    {resource.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Quantity: {resource.quantity}
                                            </p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {new Date(resource.createdAt).toLocaleDateString()}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
} 