import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../lib/firebase";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
