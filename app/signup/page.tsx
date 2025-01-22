'use client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SignupForm from '@/components/forms/SignupForm';

export default function SignupPage() {
  const { token, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
    if (token) router.push('/');
  }, [token, router, initialize]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/5 border border-gray-800 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white">Create Account</h2>
        <SignupForm />
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}