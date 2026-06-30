'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

import { useAuth, authErrorMessage } from '@/features/auth/auth-context';
import { Button, Input, Spinner } from '@/components/ui';

export default function ExpositorLoginPage() {
  const router = useRouter();
  const { user, initializing, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && user) {
      router.replace('/portal/expositor');
    }
  }, [initializing, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.replace('/portal/expositor');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (initializing || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">
            💼
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            Portal do Expositor
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Gerencie os dados da sua empresa e veja seus leads da feira.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              E-mail corporativo
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="expositor@empresa.com"
              required
              className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-rose-400 text-center bg-rose-950/15 border border-rose-900/50 py-2.5 rounded-lg">
              ⚠️ {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase py-6 text-[15px] tracking-wide rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer">
            {loading ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Acessar o Painel'}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-400">
            Ainda não tem conta ou precisa vincular seu estande?{' '}
            <Link href="/portal/expositor/cadastro" className="font-bold text-amber-400 hover:underline">
              Vincular Empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
