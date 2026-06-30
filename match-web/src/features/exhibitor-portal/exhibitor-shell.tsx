'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { getExhibitorByOwner } from '@/lib/services/exhibitors';
import { Button, Spinner } from '@/components/ui';
import { type Exhibitor } from '@/domain/exhibitor';

const NAV = [
  { href: '/portal/expositor', label: 'Dashboard', icon: '▦' },
  { href: '/portal/expositor/perfil', label: 'Meu Perfil', icon: '⚙' },
  { href: '/portal/expositor/leads', label: 'Leads de Vendas', icon: '👥' },
];

export function ExhibitorShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing, signOut } = useAuth();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/portal/expositor/login');
    }
  }, [initializing, user, router]);

  useEffect(() => {
    async function loadExhibitor() {
      if (!user) return;
      try {
        const ex = await getExhibitorByOwner(user.uid);
        setExhibitor(ex);
        // Se logou mas não tem empresa vinculada, força o cadastro/vinculação
        if (!ex && pathname !== '/portal/expositor/cadastro') {
          router.replace('/portal/expositor/cadastro');
        }
      } catch (err) {
        console.error('Erro ao carregar expositor:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadExhibitor();
    } else {
      setLoading(false);
    }
  }, [user, pathname, router]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  if (initializing || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  // Se não estiver na tela de cadastro e não tiver expositor vinculado, exibimos um aviso ou permitimos vincular
  if (!exhibitor && pathname !== '/portal/expositor/cadastro') {
    return null; // Será redirecionado
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className={`flex shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        {collapsed ? (
          <div className="border-b border-slate-800 py-4 flex flex-col items-center justify-center gap-3">
            <div className="rounded-lg bg-slate-950 px-2 py-1.5 border border-amber-500/20">
              <img src="/logo-menu.png" alt="Logo" className="h-7 w-auto object-contain brightness-110" />
            </div>
            <button
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-sm cursor-pointer"
            >
              ▶
            </button>
          </div>
        ) : (
          <div className="border-b border-slate-800 px-4 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 rounded-lg bg-slate-950 px-2 py-1.5 border border-amber-500/20">
                <img src="/logo-menu.png" alt="Logo" className="h-8 w-auto object-contain brightness-110" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider text-amber-400 truncate">
                  {exhibitor ? exhibitor.company : 'Expositor'}
                </p>
                <p className="text-xs font-semibold text-slate-400 uppercase truncate">
                  Estande {exhibitor?.stand || '--'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-sm shrink-0 cursor-pointer"
            >
              ◀
            </button>
          </div>
        )}
        
        <nav className="flex flex-1 flex-col gap-1 p-2.5">
          {NAV.map((item) => {
            const active = item.href === '/portal/expositor' ? pathname === '/portal/expositor' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}>
                <span className={`text-center text-lg shrink-0 ${collapsed ? 'w-full text-xl' : 'w-5'}`}>{item.icon}</span>
                {!collapsed && <span className="text-[15px] font-semibold truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-slate-800 p-2.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <p className="truncate px-2 pb-2 text-xs text-slate-500" title={user.email ?? ''}>
              {user.email}
            </p>
          )}
          <Button
            variant="ghost"
            className={`w-full text-slate-400 hover:text-rose-400 hover:bg-rose-950/15 ${collapsed ? 'justify-center !px-0' : 'justify-start'}`}
            onClick={async () => {
              await signOut();
              router.replace('/portal/expositor/login');
            }}>
            {collapsed ? '⎋' : '⎋ Sair do Portal'}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

export function ExhibitorPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 border-b border-slate-800 pb-5">
      <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
        {title}
      </h1>
      {description ? <p className="mt-1.5 text-base text-slate-400 font-medium">{description}</p> : null}
    </header>
  );
}
