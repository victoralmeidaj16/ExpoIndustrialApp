'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { useAdminRole } from '@/features/auth/use-admin';
import { Button, Spinner } from '@/components/ui';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/croqui', label: 'Croqui', icon: '🗺' },
  { href: '/agenda', label: 'Agenda', icon: '🗓' },
  { href: '/patrocinadores', label: 'Patrocinadores', icon: '★' },
  { href: '/materiais', label: 'Materiais', icon: '📎' },
  { href: '/visitantes', label: 'Visitantes', icon: '👥' },
  { href: '/avisos', label: 'Avisos', icon: '🔔' },
  { href: '/evento', label: 'Evento', icon: '⚙' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!initializing && !user) router.replace('/login');
  }, [initializing, user, router]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  if (initializing || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    );
  }

  if (!user) return null; // redirecionando

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este painel é da equipe organizadora. Para liberar, crie um documento em{' '}
            <code className="rounded bg-slate-100 px-1">admins/{user.uid}</code> no Firestore.
          </p>
          <p className="mt-4 select-all break-all rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-indigo-600">
            {user.uid}
          </p>
          <Button
            variant="secondary"
            className="mt-5 w-full"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        {collapsed ? (
          <div className="border-b border-slate-200 py-4 flex flex-col items-center justify-center gap-3">
            <div className="rounded-lg bg-[#071A33] px-2 py-1.5">
              <img src="/logo-menu.png" alt="Logo" className="h-7 w-auto object-contain" />
            </div>
            <button
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition text-sm cursor-pointer"
              title="Expandir menu"
            >
              ▶
            </button>
          </div>
        ) : (
          <div className="border-b border-slate-200 px-4 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 rounded-lg bg-[#071A33] px-2 py-1.5">
                <img src="/logo-menu.png" alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider text-[#C9A24C] truncate">
                  Match365
                </p>
                <p className="text-xs font-extrabold text-[#071A33] uppercase truncate">Organizador</p>
              </div>
            </div>
            <button
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition text-sm shrink-0 cursor-pointer"
              title="Recolher menu"
            >
              ◀
            </button>
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-1 p-2.5">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-[#071A33]/5 text-[#071A33]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#071A33]'
                }`}>
                <span className={`text-center text-lg shrink-0 ${collapsed ? 'w-full text-xl' : 'w-5'}`}>{item.icon}</span>
                {!collapsed && <span className="text-[15px] font-semibold truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`border-t border-slate-200 p-2.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <p className="truncate px-2 pb-2 text-xs text-slate-400" title={user.email ?? ''}>
              {user.email}
            </p>
          )}
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center !px-0' : 'justify-start'}`}
            title="Sair"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}>
            {collapsed ? '⎋' : '⎋ Sair'}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

/** Cabeçalho padrão de cada página do painel. */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-black text-[#071A33] uppercase tracking-tight">{title}</h1>
      {description ? <p className="mt-1.5 text-base text-slate-500 font-medium">{description}</p> : null}
    </header>
  );
}
