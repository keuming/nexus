import { createContext, useContext, type ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, unwrap } from './api';

export interface User { id: string; email: string; name: string; role: 'admin' | 'owner' | 'customer'; guest?: boolean }
interface Ctx { user: User | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['me'],
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: 'always', // un autre onglet a pu changer de compte (cookie partagé) : on le détecte au retour sur l'onglet
    queryFn: async () => {
      try { return (await unwrap(api.auth.me.$get())).user as User; }
      catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
  });
  // Si le compte connecté change (autre onglet, autre connexion) alors que cette page affiche les données de l'ancien compte,
  // on recharge : aucune donnée d'un compte ne doit rester affichée sous l'identité d'un autre.
  const seen = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (q.isLoading) return;
    const id = q.data?.id ?? null;
    if (seen.current && seen.current !== id) { qc.clear(); window.location.reload(); return; }
    seen.current = id;
  }, [q.data, q.isLoading, qc]);
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ['me'] }); };
  const logout = async () => {
    try { await unwrap(api.auth.logout.$post()); } catch { /* on déconnecte l'interface quoi qu'il arrive */ }
    qc.clear();
    qc.setQueryData(['me'], null);
    window.location.assign('/');
  };
  return <AuthCtx.Provider value={{ user: q.data ?? null, loading: q.isLoading, refresh, logout }}>{children}</AuthCtx.Provider>;
}
