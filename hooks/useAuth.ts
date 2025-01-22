import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = (requiredRole?: string) => {
  const { user, token, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!token) {
      router.push('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
    }
  }, [isInitialized, token, user, requiredRole, router]);

  return { user, isLoading: !isInitialized };
};