import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import superjson from "superjson";

export interface ClientUser {
  id: string;
  email: string;
  name: string;
}

interface ClientAuthContextType {
  user: ClientUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    city?: string;
  }) => Promise<void>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

// Helper to call tRPC mutations directly via fetch
async function callTRPCMutation<T>(procedure: string, input: unknown): Promise<T> {
  const body = superjson.stringify([{ json: input }]);
  const res = await fetch(`/api/trpc/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  const data = Array.isArray(json) ? json[0] : json;
  if (data?.error) throw new Error(data.error.message || "Erreur serveur");
  return superjson.deserialize(data.result?.data ?? data.result ?? data) as T;
}

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("clientUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("clientUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await callTRPCMutation<{ id: number; email: string | null; name: string }>(
        "clientAuth.login",
        { email, password }
      );
      if (result && result.id) {
        const userData: ClientUser = {
          id: result.id.toString(),
          email: result.email ?? email,
          name: result.name,
        };
        setUser(userData);
        localStorage.setItem("clientUser", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    city?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await callTRPCMutation<{ success: boolean; message: string; id?: number; email?: string | null; name?: string }>(
        "clientAuth.signup",
        {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || "",
          country: data.country || "",
          city: data.city || "",
        }
      );
      if (result && result.id) {
        const userData: ClientUser = {
          id: result.id.toString(),
          email: result.email ?? data.email,
          name: result.name ?? data.name,
        };
        setUser(userData);
        localStorage.setItem("clientUser", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("clientUser");
  };

  return (
    <ClientAuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error("useClientAuth must be used within ClientAuthProvider");
  }
  return context;
}
