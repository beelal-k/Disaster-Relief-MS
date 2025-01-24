'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Map from '../common/Map';
import { createNeed } from '@/lib/api';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const formSchema = z.object({
  type: z.enum(['food', 'shelter', 'medical', 'water', 'other'], {
    required_error: 'Please select a type',
  }),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  urgency: z.enum(['high', 'medium', 'low'], {
    required_error: 'Please select urgency level',
  }),
});

interface NeedFormProps {
  onSubmit: (data: z.infer<typeof formSchema> & { location: { lat: number; lng: number } }) => Promise<void>;
  location: { lat: number; lng: number } | null;
}

export default function NeedForm({ onSubmit, location }: NeedFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      description: '',
      urgency: undefined,
    },
  });

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    if (!location) return;

    try {
      setLoading(true);
      await onSubmit({
        ...data,
        location
      });
      toast({
        title: 'Need reported successfully',
        description: 'Your need has been reported and will be addressed soon.',
      });
      form.reset();
    } catch (error: any) {
      if (error.response?.data?.field) {
        form.setError(error.response.data.field as any, {
          type: 'manual',
          message: error.response.data.message,
        });
      } else {
        form.setError('root', {
          type: 'manual',
          message: error.message || 'Something went wrong',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Need</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="urgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Urgency Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the need in detail"
                  className="bg-neutral-800 border-neutral-700 text-white resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!location || form.formState.isSubmitting}
            className="bg-white text-black hover:bg-white/90"
          >
            {form.formState.isSubmitting ? 'Creating...' : 'Create Need'}
          </Button>
        </div>
      </form>
    </Form>
  );
}