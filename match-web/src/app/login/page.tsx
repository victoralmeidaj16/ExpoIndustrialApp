'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/features/auth/auth-context';
import { Spinner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && user) router.replace('/');
  }, [initializing, user, router]);

  if (initializing || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    );
  }

  return <LoginForm />;
}
