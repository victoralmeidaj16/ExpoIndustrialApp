'use client';

import { type ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';

export default function PainelLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
