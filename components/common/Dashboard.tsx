'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NeedForm from '@/components/forms/NeedForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

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
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showNeedForm, setShowNeedForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{
        display_name: string;
        lat: number;
        lon: number;
    }>>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    async function fetchData() {
        try {
            const [needsRes, resourcesRes] = await Promise.all([
                api.get('/needs'),
                api.get('/resources')
            ]);

            setNeeds(needsRes.data);
            setResources(resourcesRes.data);
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

    const handleMapClick = (lat: number, lng: number) => {
        setSelectedLocation({ lat, lng });
        setShowNeedForm(true);
    };

    const handleCreateNeed = async (data: {
        type: string;
        description: string;
        urgency: 'high' | 'medium' | 'low';
        location: { lat: number; lng: number };
    }) => {
        try {
            await api.post('/needs', data);
            toast({
                title: 'Success',
                description: 'Need created successfully.',
            });
            setShowNeedForm(false);
            fetchData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create need.',
                variant: 'destructive',
            });
        }
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            try {
                setIsSearching(true);
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
                );
                const data = await response.json();
                setSearchResults(data.map((item: any) => ({
                    display_name: item.display_name,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                })));
                setShowSearchResults(true);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to search location.',
                    variant: 'destructive',
                });
            } finally {
                setIsSearching(false);
            }
        },
        []
    );

    // Effect for debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            debouncedSearch(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    function handleLocationSelect(location: { lat: number; lon: number }) {
        setSelectedLocation({ lat: location.lat, lng: location.lon });
        setShowSearchResults(false);
        setSearchQuery('');
    }

    const allMarkers = [
        ...needMarkers,
        ...resourceMarkers,
        ...(selectedLocation ? [{
            position: [selectedLocation.lat, selectedLocation.lng] as [number, number],
            popup: (
                <div className="min-w-[200px] p-4">
                    <h3 className="font-bold text-lg mb-4">Selected Location</h3>
                    <Button
                        className="w-full"
                        onClick={() => {
                            handleMapClick(selectedLocation.lat, selectedLocation.lng);
                            setSelectedLocation(null);
                        }}
                    >
                        Create Need Here
                    </Button>
                </div>
            ),
        }] : []),
    ];

    return (
        <div className="fixed inset-0 left-64"> {/* Start from sidebar edge */}
            {/* Map taking full space */}
            <Map
                className="w-full h-screen"
                markers={allMarkers}
                interactive={true}
                onLocationSelect={handleMapClick}
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                zoom={selectedLocation ? 15 : undefined}
            />

            {/* Search overlay */}
            <div className="absolute top-8 left-8 z-[1000] w-96">
                <Card className="border-0 bg-transparent text-white">
                    <div className="relative flex shadow items-center px-4 py-2 gap-1 rounded-full bg-neutral-800/90 border-neutral-700">
                        <Input
                            placeholder="Search location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent focus:outline-none outline-none border-0 text-white pr-20"
                        />
                        {isSearching ? (
                            <div className="h-full bg-transparent group border-0">
                                <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
                            </div>
                        ) : (
                            <Search className="w-7 h-7 text-neutral-400" />
                        )}
                    </div>

                    {showSearchResults && searchResults.length > 0 && (
                        <Card className="mt-2 p-2 overflow-auto space-y-2 bg-neutral-800/90 border-neutral-700">
                            {searchResults.map((result, index) => (
                                <Button
                                    key={index}
                                    variant="ghost"
                                    className="w-full text-wrap word-break pb-5 text-white hover:text-white justify-start text-left text-sm p-2 hover:bg-neutral-700"
                                    onClick={() => handleLocationSelect(result)}
                                >
                                    {result.display_name}
                                </Button>
                            ))}
                        </Card>
                    )}
                </Card>
            </div>

            {/* Right Sidebar */}
            <div className="absolute top-0 z-[1000] right-0 h-screen w-96 bg-black/70 backdrop-blur-sm border-l border-neutral-800 text-white overflow-hidden flex flex-col">
                <div className="p-4 border-b border-neutral-800">
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
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger className="text-white bg-neutral-800/90 border-neutral-700">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="needs" className="flex-1 flex flex-col">
                    <TabsList className="w-full justify-start px-4 py-2 bg-transparent border-b border-neutral-800">
                        <TabsTrigger value="needs">Needs</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                    </TabsList>

                    <TabsContent value="needs" className="flex-1 p-0 m-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {loading ? (
                                    <p>Loading needs...</p>
                                ) : filteredNeeds.length === 0 ? (
                                    <p>No needs found.</p>
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
                                            <div className="mt-2 text-xs text-neutral-400">
                                                {new Date(need.createdAt).toLocaleDateString()}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="resources" className="flex-1 p-0 m-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {loading ? (
                                    <p>Loading resources...</p>
                                ) : filteredResources.length === 0 ? (
                                    <p>No resources found.</p>
                                ) : (
                                    filteredResources.map((resource) => (
                                        <Card key={resource._id} className="p-4 bg-neutral-800/90 border-neutral-700 text-white">
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
                                            <p className="text-sm text-neutral-300 mt-2">
                                                Quantity: {resource.quantity}
                                            </p>
                                            <div className="mt-2 text-xs text-neutral-400">
                                                {new Date(resource.createdAt).toLocaleDateString()}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Need Form Dialog */}
            <Dialog open={showNeedForm} onOpenChange={setShowNeedForm}>
                <DialogContent className='bg-neutral-800/90 border-neutral-700 text-white'>
                    <DialogHeader>
                        <DialogTitle>Create New Need</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new need at the selected location.
                        </DialogDescription>
                    </DialogHeader>
                    <NeedForm onSubmit={handleCreateNeed} location={selectedLocation} />
                </DialogContent>
            </Dialog>
        </div>
    );
} 