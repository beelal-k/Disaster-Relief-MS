'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Map from '../common/Map';
import { createResource } from '@/lib/api';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    type: z.string().min(1, 'Type is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    status: z.enum(['available', 'in-transit', 'depleted']),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
});

export default function ResourceForm() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: '',
            quantity: 1,
            status: 'available',
            location: {
                lat: 0,
                lng: 0,
            },
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true);
            await createResource(values);
            toast({
                title: 'Resource added successfully',
                description: 'The resource has been added to the system.',
            });
            form.reset();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add resource. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type of Resource</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select resource type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="food">Food Supplies</SelectItem>
                                            <SelectItem value="water">Water</SelectItem>
                                            <SelectItem value="medical">Medical Supplies</SelectItem>
                                            <SelectItem value="shelter">Shelter Supplies</SelectItem>
                                            <SelectItem value="clothing">Clothing</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="in-transit">In Transit</SelectItem>
                                            <SelectItem value="depleted">Depleted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </Card>

                    <Card className="p-6">
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            <Map
                                                onLocationSelect={(lat, lng) => {
                                                    form.setValue('location', { lat, lng }, { shouldValidate: true });
                                                }}
                                                markers={field.value.lat !== 0 ? [
                                                    {
                                                        position: [field.value.lat, field.value.lng],
                                                        popup: 'Resource Location',
                                                    }
                                                ] : []}
                                                zoom={6}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    type="number"
                                                    placeholder="Latitude"
                                                    value={field.value.lat}
                                                    onChange={(e) => {
                                                        form.setValue('location', {
                                                            ...field.value,
                                                            lat: parseFloat(e.target.value),
                                                        });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Longitude"
                                                    value={field.value.lng}
                                                    onChange={(e) => {
                                                        form.setValue('location', {
                                                            ...field.value,
                                                            lng: parseFloat(e.target.value),
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </Card>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Adding Resource...' : 'Add Resource'}
                </Button>
            </form>
        </Form>
    );
} 