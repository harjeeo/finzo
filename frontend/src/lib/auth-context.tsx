import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  sub: string;
  email: string;
  businessId: string | null;
  role: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    businessName: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "finzo.auth";

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persistTokens = (next: AuthTokens | null) => {
    setTokens(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    persistTokens(result);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    businessName: string,
  ) => {
    const result = await apiFetch<AuthTokens>("/auth/register", {
      method: "POST",
      body: { name, email, password, businessName },
    });
    persistTokens(result);
  };

  const logout = () => {
    persistTokens(null);
  };

  const user = useMemo(
    () => (tokens ? decodeJwt(tokens.accessToken) : null),
    [tokens],
  );

  const value: AuthContextValue = {
    user,
    accessToken: tokens?.accessToken ?? null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
