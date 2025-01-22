'use client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  const { token, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
    if (token) router.push('/');
  }, [token, router, initialize]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/5 border border-gray-800 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white">Disaster Relief Login</h2>
        <LoginForm />
      </div>
    </div>
  );
}