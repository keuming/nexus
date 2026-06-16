/**
 * Hook pour implémenter le lazy loading des onglets
 * Charge les données seulement quand l'onglet est actif
 */

import { useEffect, useRef } from "react";

interface UseLazyTabOptions {
  tabName: string;
  isActive: boolean;
  onLoad?: (() => void) | (() => Promise<void>);
  delay?: number;
}

/**
 * Hook qui déclenche une action quand un onglet devient actif
 * Utile pour charger les données à la demande
 */
export function useLazyTab({
  tabName,
  isActive,
  onLoad,
  delay = 0,
}: UseLazyTabOptions) {
  const hasLoadedRef = useRef(false);
  const timeoutRef = useRef<any>(undefined);

  useEffect(() => {
    if (isActive && !hasLoadedRef.current && onLoad) {
      // Marquer comme chargé immédiatement pour éviter les chargements multiples
      hasLoadedRef.current = true;

      // Ajouter un délai optionnel avant de charger
      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          const result = onLoad();
          if (result instanceof Promise) {
            void result;
          }
        }, delay);
      } else {
        const result = onLoad();
        if (result instanceof Promise) {
          void result;
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, onLoad, delay, tabName]);

  return { hasLoaded: hasLoadedRef.current };
}

/**
 * Hook pour gérer le prefetching des onglets
 * Précharge les données des onglets adjacents
 */
export function usePrefetchTabs(
  currentTab: string,
  tabs: string[],
  prefetchFn: (tabName: string) => void
) {
  useEffect(() => {
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex === -1) return;

    // Prefetch l'onglet suivant et précédent
    if (currentIndex > 0) {
      prefetchFn(tabs[currentIndex - 1]);
    }
    if (currentIndex < tabs.length - 1) {
      prefetchFn(tabs[currentIndex + 1]);
    }
  }, [currentTab, tabs, prefetchFn]);
}
