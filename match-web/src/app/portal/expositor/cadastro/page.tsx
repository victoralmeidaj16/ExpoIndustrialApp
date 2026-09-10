'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { auth, db } from '@/lib/firebase';
import { useAuth, authErrorMessage } from '@/features/auth/auth-context';
import { Button, Input, Spinner } from '@/components/ui';
import { EXHIBITORS_COLLECTION, type Exhibitor } from '@/domain/exhibitor';

type AuthorizedBooth = Pick<Exhibitor, 'id' | 'company' | 'stand' | 'area' | 'category'>;

export default function ExpositorCadastroPage() {
  const router = useRouter();
  const { user: currentUser, initializing, signOut } = useAuth();

  const [availableBooths, setAvailableBooths] = useState<AuthorizedBooth[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedExhibitorId, setSelectedExhibitorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationRevision, setVerificationRevision] = useState(0);

  // Se já estiver logado e já tiver empresa vinculada, manda pro dashboard.
  useEffect(() => {
    async function checkExhibitorAssociation() {
      if (!initializing && currentUser && db) {
        const q = query(
          collection(db, EXHIBITORS_COLLECTION),
          where('ownerUid', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          router.replace('/portal/expositor');
        }
      }
    }
    checkExhibitorAssociation();
  }, [initializing, currentUser, router]);

  // A API devolve somente os estandes previamente autorizados para o e-mail
  // verificado da conta. A lista completa nunca é exposta pelo cadastro.
  useEffect(() => {
    async function loadAvailableBooths() {
      if (!currentUser?.emailVerified) return;
      try {
        const idToken = await currentUser.getIdToken(true);
        const response = await fetch('/api/portal/expositor/vincular', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error ?? 'Não foi possível consultar os estandes autorizados.');
        }
        setAvailableBooths(Array.isArray(result.booths) ? result.booths : []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingBooths(false);
      }
    }

    loadAvailableBooths();
  }, [currentUser, verificationRevision]);

  async function resendVerificationEmail() {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmEmailVerification() {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await currentUser.reload();
      if (!currentUser.emailVerified) {
        setError('O e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.');
        return;
      }
      await currentUser.getIdToken(true);
      setLoadingBooths(true);
      setVerificationRevision((revision) => revision + 1);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);

    try {
      if (!auth || !db) throw new Error('Firebase não inicializado.');

      if (!currentUser) {
        const account = (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
        await sendEmailVerification(account);
        setVerificationSent(true);
        return;
      }

      if (!currentUser.emailVerified) {
        setError('Confirme seu e-mail corporativo antes de vincular o estande.');
        return;
      }

      if (!selectedExhibitorId) {
        setError('Selecione a empresa/estande autorizado para esta conta.');
        return;
      }

      // O vínculo escreve `ownerUid`/`status`, campos que as Security Rules
      // reservam ao organizador — por isso passa pela rota com Admin SDK.
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch('/api/portal/expositor/vincular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ exhibitorId: selectedExhibitorId }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error ?? 'Não foi possível vincular o estande. Tente novamente.');
      }

      router.replace('/portal/expositor');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">
            🤝
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            Vincular seu Estande
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Associe sua conta de usuário à sua empresa expositora para começar a gerenciar o perfil.
          </p>
        </div>

        {!currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-slate-300">
              Primeiro crie sua conta e confirme o e-mail corporativo. Depois mostraremos somente
              o estande que a organização autorizou para esse endereço.
            </div>

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
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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
              {loading ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Criar conta e verificar e-mail'}
            </Button>
          </form>
        ) : !currentUser.emailVerified ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
              <div className="mb-2 text-3xl">✉️</div>
              <h2 className="font-bold text-amber-300">Confirme seu e-mail corporativo</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Enviamos um link para <strong>{currentUser.email}</strong>. A seleção do estande só
                será liberada depois da confirmação.
              </p>
              {verificationSent && (
                <p className="mt-3 text-xs font-semibold text-emerald-400">
                  E-mail de verificação enviado. Confira também a caixa de spam.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm font-semibold text-rose-400 text-center bg-rose-950/15 border border-rose-900/50 py-2.5 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            <Button onClick={confirmEmailVerification} disabled={loading} className="w-full">
              {loading ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Já confirmei meu e-mail'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={resendVerificationEmail}
              disabled={loading}
              className="w-full"
            >
              Reenviar e-mail de verificação
            </Button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full text-sm font-semibold text-slate-400 hover:text-amber-400"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                E-mail confirmado
              </p>
              <p className="mt-1 text-sm text-slate-300">{currentUser.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Empresa / Estande autorizado
              </label>
              {loadingBooths ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                  <Spinner className="h-4 w-4" /> Consultando autorização...
                </div>
              ) : availableBooths.length > 0 ? (
                <select
                  value={selectedExhibitorId}
                  onChange={(event) => setSelectedExhibitorId(event.target.value)}
                  required
                  className="w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                >
                  <option value="">-- Selecione seu estande --</option>
                  {availableBooths.map((booth) => (
                    <option key={booth.id} value={booth.id}>
                      Estande {booth.stand} - {booth.company}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
                  Nenhum estande está autorizado para este e-mail. Solicite à organização que
                  cadastre <strong>{currentUser.email}</strong> na empresa correta.
                </p>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              Após o vínculo, o perfil ficará em rascunho até ser revisado e publicado pela
              organização.
            </p>

            {error && (
              <p className="text-sm font-semibold text-rose-400 text-center bg-rose-950/15 border border-rose-900/50 py-2.5 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || loadingBooths || availableBooths.length === 0}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase py-6 text-[15px] tracking-wide rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              {loading ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Confirmar e solicitar publicação'}
            </Button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full text-sm font-semibold text-slate-400 hover:text-amber-400"
            >
              Usar outro e-mail
            </button>
          </form>
        )}

        {!currentUser && (
          <div className="mt-6 text-center border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-400">
              Já possui conta associada?{' '}
              <Link href="/portal/expositor/login" className="font-bold text-amber-400 hover:underline">
                Fazer Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
