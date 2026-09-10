import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/** Nada para assinar: o valor só muda entre servidor e cliente. */
const subscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 *
 * `useSyncExternalStore` já distingue servidor de cliente (o snapshot do
 * servidor é `false`), então a hidratação não precisa de um efeito cujo único
 * trabalho seria chamar `setState` e forçar um segundo render.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
