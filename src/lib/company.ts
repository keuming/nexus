import { useQuery } from '@tanstack/react-query';
import { api, ApiError, unwrap } from './api';
import { useAuth } from './auth';

/** Entreprise du partenaire connecté (même clé de cache que le dashboard). `null` s'il n'en a pas encore créé. */
export function useMyCompany() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['company'],
    enabled: user?.role === 'owner',
    retry: false,
    queryFn: async () => {
      try { return (await unwrap(api.company.$get())).company; }
      catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
    },
  });
}
