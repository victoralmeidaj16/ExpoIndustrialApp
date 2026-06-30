'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth, db } from '@/lib/firebase';
import { useAuth, authErrorMessage } from '@/features/auth/auth-context';
import { Button, Input, Spinner } from '@/components/ui';
import { EXHIBITORS_COLLECTION, type Exhibitor } from '@/domain/exhibitor';

export default function ExpositorCadastroPage() {
  const router = useRouter();
  const { user: currentUser, initializing } = useAuth();

  const [availableBooths, setAvailableBooths] = useState<Exhibitor[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedExhibitorId, setSelectedExhibitorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Carrega estandes cadastrados pelo organizador que estão sem dono vinculado
  useEffect(() => {
    async function loadAvailableBooths() {
      if (!db) return;
      try {
        const snap = await getDocs(collection(db, EXHIBITORS_COLLECTION));
        const list: Exhibitor[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          // Estande sem dono
          if (!data.ownerUid) {
            list.push({
              id: docSnap.id,
              company: data.company ?? `Estande ${data.stand || docSnap.id}`,
              stand: data.stand ?? docSnap.id,
              area: data.area ?? '',
              category: data.category ?? 'Standard',
              industry: data.industry ?? '',
              about: data.about ?? '',
              products: data.products ?? [],
              fit: data.fit ?? 0,
              point: data.point ?? { x: 0.5, y: 0.5 },
              logo: data.logo ?? '',
            });
          }
        });
        // Ordena por número de estande
        list.sort((a, b) => a.stand.localeCompare(b.stand, undefined, { numeric: true }));
        setAvailableBooths(list);
      } catch (err) {
        console.error('Erro ao carregar estandes:', err);
      } finally {
        setLoadingBooths(false);
      }
    }

    loadAvailableBooths();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedExhibitorId) {
      setError('Por favor, selecione a sua empresa/estande da lista.');
      return;
    }

    setLoading(true);

    try {
      if (!auth || !db) throw new Error('Firebase não inicializado.');

      let uid = '';

      // Caso 1: Usuário já está logado mas quer vincular o estande
      if (currentUser) {
        uid = currentUser.uid;
      } else {
        // Caso 2: Criando nova conta
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = credential.user.uid;
      }

      // Vincula a conta ao estande no Firestore
      const docRef = doc(db, EXHIBITORS_COLLECTION, selectedExhibitorId);
      await updateDoc(docRef, {
        ownerUid: uid,
        contactEmail: email || currentUser?.email || '',
        status: 'published',
      });

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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selecionar Estande */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selecione sua Empresa / Estande
            </label>
            {loadingBooths ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Spinner className="w-4 h-4" /> Carregando estandes...
              </div>
            ) : (
              <select
                value={selectedExhibitorId}
                onChange={(e) => setSelectedExhibitorId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-3 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none text-sm cursor-pointer"
              >
                <option value="">-- Selecione seu estande --</option>
                {availableBooths.map((booth) => (
                  <option key={booth.id} value={booth.id}>
                    Estande {booth.stand} - {booth.company}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Se já estiver logado, não precisa de email/senha */}
          {!currentUser && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  E-mail corporativo (para criar conta)
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
                  required
                  className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm font-semibold text-rose-400 text-center bg-rose-950/15 border border-rose-900/50 py-2.5 rounded-lg">
              ⚠️ {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase py-6 text-[15px] tracking-wide rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer">
            {loading ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Confirmar e Vincular'}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-400">
            Já possui conta associada?{' '}
            <Link href="/portal/expositor/login" className="font-bold text-amber-400 hover:underline">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
