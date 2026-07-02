'use client';

import Link from 'next/link';

import { PageHeader } from '@/components/app-shell';
import { Card, Spinner } from '@/components/ui';
import { hasPlacement, type Exhibitor } from '@/domain/exhibitor';
import { type Session } from '@/domain/session';
import { type EventConfig } from '@/domain/event';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { useSessions } from '@/features/sessions/use-sessions';
import { useSponsors } from '@/features/sponsors/use-sponsors';
import { useVisitors } from '@/features/visitors/use-visitors';
import { useEventConfig } from '@/features/event/use-event-config';

function Metric({
  label,
  value,
  href,
  tone = 'slate',
}: {
  label: string;
  value: number | string;
  href: string;
  tone?: 'slate' | 'amber' | 'green' | 'indigo';
}) {
  const tones = {
    slate: 'text-slate-900',
    amber: 'text-amber-600',
    green: 'text-green-600',
    indigo: 'text-[#0C2345]',
  } as const;
  return (
    <Link href={href}>
      <Card className="p-5 transition hover:border-[#C9A24C] hover:shadow-md">
        <p className={`text-3xl font-bold ${tones[tone]}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
      </Card>
    </Link>
  );
}

/**
 * Faixa de status do evento a partir de `startDate`/`endDate` (YYYY-MM-DD).
 * Mostra contagem regressiva, "ao vivo" ou "encerrado". Some quando não há datas.
 */
function EventStatusBanner({ config }: { config: EventConfig }) {
  const status = computeEventStatus(config.startDate, config.endDate);
  if (!status) return null;

  const styles = {
    upcoming: 'border-[#F0E4C4] bg-[#FBF6E9] text-[#7A6320]',
    live: 'border-green-200 bg-green-50 text-green-700',
    ended: 'border-slate-200 bg-slate-50 text-slate-500',
  } as const;

  return (
    <div className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 ${styles[status.kind]}`}>
      <span className="text-2xl">{status.kind === 'live' ? '🔴' : status.kind === 'ended' ? '🏁' : '🗓'}</span>
      <div>
        <p className="text-lg font-bold leading-tight">{status.title}</p>
        {status.subtitle ? <p className="text-sm font-medium opacity-80">{status.subtitle}</p> : null}
      </div>
    </div>
  );
}

type EventStatus = { kind: 'upcoming' | 'live' | 'ended'; title: string; subtitle?: string };

/** Converte "YYYY-MM-DD" em Date local (meia-noite). Retorna null se inválido. */
function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeEventStatus(startDate: string, endDate: string): EventStatus | null {
  const start = parseLocalDate(startDate);
  if (!start) return null;
  const end = parseLocalDate(endDate) ?? start;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayMs = 24 * 60 * 60 * 1000;
  const daysToStart = Math.round((start.getTime() - today.getTime()) / dayMs);
  const daysToEnd = Math.round((end.getTime() - today.getTime()) / dayMs);

  if (daysToEnd < 0) {
    return { kind: 'ended', title: 'Evento encerrado', subtitle: 'As datas da feira já passaram.' };
  }
  if (daysToStart <= 0) {
    return {
      kind: 'live',
      title: 'Evento ao vivo',
      subtitle: daysToEnd > 0 ? `Encerra em ${daysToEnd} ${daysToEnd === 1 ? 'dia' : 'dias'}.` : 'Último dia da feira.',
    };
  }
  return {
    kind: 'upcoming',
    title: daysToStart === 1 ? 'Falta 1 dia para a feira' : `Faltam ${daysToStart} dias para a feira`,
    subtitle: 'Use este tempo para finalizar o croqui e a agenda.',
  };
}

type Alert = { label: string; count: number; href: string };

/** Itens acionáveis: o que ainda falta o organizador resolver antes de abrir as portas. */
function buildAlerts(exhibitors: Exhibitor[], sessions: Session[]): Alert[] {
  const published = exhibitors.filter((e) => e.status === 'published');

  const publishedNoLogo = published.filter((e) => !e.logoUrl && !e.logo).length;
  const publishedNoPlacement = published.filter((e) => !hasPlacement(e)).length;
  const sessionsNoSpeaker = sessions.filter((s) => !s.speaker.trim()).length;
  const sessionsNoSchedule = sessions.filter((s) => !s.time.trim() || !s.location.trim()).length;

  const alerts: Alert[] = [
    { label: 'expositores publicados sem logo', count: publishedNoLogo, href: '/croqui' },
    { label: 'expositores publicados sem posição no croqui', count: publishedNoPlacement, href: '/croqui' },
    { label: 'sessões sem palestrante', count: sessionsNoSpeaker, href: '/agenda' },
    { label: 'sessões sem horário ou local', count: sessionsNoSchedule, href: '/agenda' },
  ];

  return alerts.filter((a) => a.count > 0);
}

export default function DashboardPage() {
  const { exhibitors, loading: exLoading } = useExhibitors();
  const { sessions, loading: seLoading } = useSessions();
  const { sponsors, loading: spLoading } = useSponsors();
  const { visitors, loading: viLoading } = useVisitors();
  const { config, loading: cfLoading } = useEventConfig();

  const loading = exLoading || seLoading || spLoading || viLoading || cfLoading;
  const placed = exhibitors.filter(hasPlacement).length;
  const unplaced = exhibitors.length - placed;
  const published = exhibitors.filter((e) => e.status === 'published').length;

  const onboarded = visitors.filter((v) => v.onboardingCompleted).length;
  const onboardingRate = visitors.length ? Math.round((onboarded / visitors.length) * 100) : 0;

  const alerts = buildAlerts(exhibitors, sessions);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do evento. Os dados são compartilhados com o app da feira em tempo real."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <EventStatusBanner config={config} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Metric label="Expositores" value={exhibitors.length} href="/croqui" tone="indigo" />
            <Metric label="Publicados" value={published} href="/croqui" tone="green" />
            <Metric label="Sem posição no croqui" value={unplaced} href="/croqui" tone="amber" />
            <Metric label="Posicionados" value={placed} href="/croqui" tone="slate" />
            <Metric label="Sessões na agenda" value={sessions.length} href="/agenda" tone="slate" />
            <Metric label="Patrocinadores" value={sponsors.length} href="/patrocinadores" tone="slate" />
            <Metric label="Visitantes cadastrados" value={visitors.length} href="/visitantes" tone="indigo" />
            <Metric
              label={`Onboarding concluído (${onboardingRate}%)`}
              value={onboarded}
              href="/visitantes"
              tone="green"
            />
          </div>

          <Card className="mt-6 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Pendências</h2>
            {alerts.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-600">
                <span>✓</span> Tudo certo — nenhuma pendência encontrada.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {alerts.map((alert) => (
                  <li key={alert.label}>
                    <Link
                      href={alert.href}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-amber-50">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-100 px-2 text-sm font-bold text-amber-700">
                        {alert.count}
                      </span>
                      <span className="font-medium text-slate-700">{alert.label}</span>
                      <span className="ml-auto text-[#0C2345] hover:text-[#C9A24C] font-semibold">resolver →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="mt-6 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Atalhos</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href="/croqui" className="text-[#0C2345] hover:text-[#C9A24C] font-semibold hover:underline">
                Posicionar estandes no croqui →
              </Link>
              <Link href="/agenda" className="text-[#0C2345] hover:text-[#C9A24C] font-semibold hover:underline">
                Gerenciar agenda →
              </Link>
              <Link href="/patrocinadores" className="text-[#0C2345] hover:text-[#C9A24C] font-semibold hover:underline">
                Gerenciar patrocinadores →
              </Link>
              <Link href="/evento" className="text-[#0C2345] hover:text-[#C9A24C] font-semibold hover:underline">
                Editar dados do evento →
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
