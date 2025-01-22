'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Dashboard from '@/components/common/Dashboard';
import NeedForm from '@/components/forms/NeedForm';
import ResourceForm from '@/components/forms/ResourceForm';
import { getCurrentUser } from '@/lib/api';
import Layout from '@/components/common/Layout';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Disaster Relief Management System</h1>
          <p className="text-gray-400">Welcome, {user.email}</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:max-w-[400px] bg-white/5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            {user.role === 'individual' && (
              <TabsTrigger value="report-need">Report Need</TabsTrigger>
            )}
            {user.role === 'organization' && (
              <TabsTrigger value="add-resource">Add Resource</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Card className="p-6 bg-white/5 border-gray-800">
              <Dashboard />
            </Card>
          </TabsContent>

          {user.role === 'individual' && (
            <TabsContent value="report-need">
              <Card className="p-6 bg-white/5 border-gray-800">
                <h2 className="text-2xl font-semibold mb-6 text-white">Report a Need</h2>
                <NeedForm />
              </Card>
            </TabsContent>
          )}

          {user.role === 'organization' && (
            <TabsContent value="add-resource">
              <Card className="p-6 bg-white/5 border-gray-800">
                <h2 className="text-2xl font-semibold mb-6 text-white">Add Resource</h2>
                <ResourceForm />
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}