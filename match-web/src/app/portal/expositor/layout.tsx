'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { ExhibitorShell } from '@/features/exhibitor-portal/exhibitor-shell';

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Ignora o Shell nas telas de login/cadastro
  const isAuthRoute =
    pathname === '/portal/expositor/login' || pathname === '/portal/expositor/cadastro';

  if (isAuthRoute) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return <ExhibitorShell>{children}</ExhibitorShell>;
}
