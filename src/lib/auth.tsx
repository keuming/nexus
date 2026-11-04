import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, unwrap } from './api';

export interface User { id: string; email: string; name: string; role: 'admin' | 'owner' | 'customer' }
interface Ctx { user: User | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['me'],
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      try { return (await unwrap(api.auth.me.$get())).user as User; }
      catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
  });
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ['me'] }); };
  const logout = async () => { await unwrap(api.auth.logout.$post()); qc.clear(); await refresh(); };
  return <AuthCtx.Provider value={{ user: q.data ?? null, loading: q.isLoading, refresh, logout }}>{children}</AuthCtx.Provider>;
}
