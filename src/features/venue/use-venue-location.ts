import { useEffect, useRef, useState } from 'react';

import type { VenuePoint } from './venue';

export type LocationSource = 'simulado' | 'gps' | 'beacon';

export type VenueLocation = {
  /** Posição atual em coordenadas normalizadas (0..1) sobre a planta. */
  point: VenuePoint;
  /** Origem do dado de posição. */
  source: LocationSource;
  /** true enquanto a pessoa está em deslocamento. */
  moving: boolean;
};

/**
 * Provedor de localização do app.
 *
 * HOJE: simula a pessoa caminhando ao longo de uma ROTA (lista de waypoints),
 * a partir do primeiro ponto até o último. Serve para validar a experiência
 * sem hardware.
 *
 * FUTURO (trocar só a implementação interna, mantendo o retorno):
 *  - GPS:    `expo-location` (watchPositionAsync) → converter lat/long em
 *            coordenada normalizada da planta.
 *  - BEACONS: BLE/UWB (build próprio) → trilateração indoor.
 * As telas que consomem `useVenueLocation` não mudam.
 */
export function useVenueLocation(path: VenuePoint[]): VenueLocation {
  const [point, setPoint] = useState<VenuePoint>(path[0] ?? { x: 0.5, y: 0.5 });
  const [moving, setMoving] = useState(true);
  const progress = useRef({ seg: 0, t: 0 });
  const key = path.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join('|');

  useEffect(() => {
    if (path.length < 2) return;
    progress.current = { seg: 0, t: 0 };
    setPoint(path[0]);
    setMoving(true);

    const SPEED = 0.05; // fração do segmento por tick
    const id = setInterval(() => {
      const { seg, t } = progress.current;
      if (seg >= path.length - 1) {
        setMoving(false);
        clearInterval(id);
        return;
      }
      const a = path[seg];
      const b = path[seg + 1];
      const nt = t + SPEED;
      if (nt >= 1) {
        progress.current = { seg: seg + 1, t: 0 };
        setPoint(b);
      } else {
        progress.current = { seg, t: nt };
        setPoint({ x: a.x + (b.x - a.x) * nt, y: a.y + (b.y - a.y) * nt });
      }
    }, 80);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { point, source: 'simulado', moving };
}
