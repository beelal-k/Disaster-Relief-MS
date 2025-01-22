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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card } from '../ui/card';

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    contactEmail: z.string().email('Invalid email address'),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url('Invalid website URL').optional(),
});

interface OrganizationFormProps {
    organization?: {
        _id: string;
        name: string;
        description: string;
        contactEmail: string;
        contactPhone?: string;
        address?: string;
        website?: string;
    };
    onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
    onCancel?: () => void;
}

export default function OrganizationForm({ organization, onSubmit, onCancel }: OrganizationFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: organization?.name || '',
            description: organization?.description || '',
            contactEmail: organization?.contactEmail || '',
            contactPhone: organization?.contactPhone || '',
            address: organization?.address || '',
            website: organization?.website || '',
        },
    });

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true);
            await onSubmit(values);
            if (!organization) {
                form.reset();
            }
            toast({
                title: `Organization ${organization ? 'updated' : 'created'} successfully`,
                description: organization
                    ? 'The organization details have been updated.'
                    : 'Your organization has been created.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || `Failed to ${organization ? 'update' : 'create'} organization.`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter organization name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="contact@organization.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Phone (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="+1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="url" placeholder="https://organization.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter organization address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe your organization and its mission"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading
                            ? organization
                                ? 'Updating Organization...'
                                : 'Creating Organization...'
                            : organization
                                ? 'Update Organization'
                                : 'Create Organization'}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 