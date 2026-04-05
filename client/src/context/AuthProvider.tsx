import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setIsLoaded(true);
    });
    return unsubscribe;
  }, []);

  const getToken = async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return new Promise<string | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (next) => {
        unsubscribe();
        if (!next) {
          resolve(null);
          return;
        }
        next
          .getIdToken()
          .then(resolve)
          .catch(() => resolve(null));
      });
    });
  };

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn: !!user,
      getToken,
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [user, isLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
