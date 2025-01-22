"use client"
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { initialize } = useAuthStore();

  useEffect(() => {

    initialize();
  }, [initialize]);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}