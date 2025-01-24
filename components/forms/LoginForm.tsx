'use client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginFormValues>();
  const {toast} = useToast();

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', values);
      login(response.data.token, response.data.user);
      toast({
        title: 'Login successful',
        description: 'You are now logged in',
      })
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-white">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Enter your email" className='bg-neutral-700 border-0 text-white' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className=''>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Enter your password" className='bg-neutral-700 border-0 text-white' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={loading} type="submit" className="w-full">
          {
            loading ? <Loader2 className="size-4 animate-spin" /> : 'Sign In'
          }
        </Button>
      </form>
    </Form>
  );
}