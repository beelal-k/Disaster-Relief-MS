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
import { Textarea } from '@/components/ui/textarea';
import Map from '../common/Map';
import { createNeed } from '@/lib/api';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  urgency: z.enum(['high', 'medium', 'low']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export default function NeedForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      description: '',
      urgency: 'medium',
      location: {
        lat: 0,
        lng: 0,
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await createNeed(values);
      toast({
        title: 'Need reported successfully',
        description: 'Your need has been reported and will be addressed soon.',
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to report need. Please try again.',
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
                  <FormLabel>Type of Help Needed</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type of help needed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="shelter">Shelter</SelectItem>
                      <SelectItem value="medical">Medical Assistance</SelectItem>
                      <SelectItem value="evacuation">Evacuation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      placeholder="Describe your situation and what you need"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
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
                            popup: 'Selected Location',
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
          {loading ? 'Reporting Need...' : 'Report Need'}
        </Button>
      </form>
    </Form>
  );
}