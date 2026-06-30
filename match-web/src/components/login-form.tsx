'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authErrorMessage, useAuth } from '@/features/auth/auth-context';
import { Button, Card, Field, Input } from '@/components/ui';


export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Technology Pattern / Grids */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#071A33_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
      
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 w-full rounded-2xl bg-[#071A33] px-5 py-4 shadow-sm">
            <img
              src="/logo-expoindustrial.png"
              alt="Expoindustrial Logo"
              className="mx-auto h-16 w-auto max-w-full object-contain"
            />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-[#C9A24C]">
            MatchIndustrial365
          </p>
        </div>

        <Card className="p-10 rounded-[24px] border border-slate-200/80 bg-white shadow-xl shadow-slate-100">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-[#071A33] uppercase tracking-tight">Painel do Organizador</h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">Acesso restrito para a equipe de gerenciamento.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="E-mail corporativo">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@empresa.com"
                required
                className="focus:border-[#C9A24C] focus:ring-[#C9A24C]"
              />
            </Field>
            
            <Field label="Senha de acesso">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha corporativa"
                required
                className="focus:border-[#C9A24C] focus:ring-[#C9A24C]"
              />
            </Field>

            {error ? (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 font-semibold">{error}</p>
            ) : null}

            <Button type="submit" disabled={busy} className="mt-2 w-full text-base font-extrabold h-12 rounded-xl shadow-sm cursor-pointer">
              {busy ? 'Verificando credenciais…' : 'Entrar no Painel'}
            </Button>
          </form>
        </Card>

        {/* Realização Footer */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realização</span>
          <div className="rounded-lg bg-[#071A33] px-3 py-2 opacity-80">
            <img src="/logo-apice.png" alt="Ápice Sistemas" className="h-6 w-auto object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
