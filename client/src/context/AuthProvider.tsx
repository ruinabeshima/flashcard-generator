import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mockAuthState = (
    window as {
      __FIREBASE_AUTH_STATE__?: {
        uid: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
      } | null;
    }
  ).__FIREBASE_AUTH_STATE__;

  const initialMockUser =
    mockAuthState &&
    ({
      ...mockAuthState,
      getIdToken: async () => "e2e-token",
    } as unknown as User);

  const [user, setUser] = useState<User | null>(initialMockUser ?? null);
  const [isLoaded, setIsLoaded] = useState(mockAuthState !== undefined);

  useEffect(() => {
    if (mockAuthState !== undefined) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setIsLoaded(true);
    });
    return unsubscribe;
  }, [mockAuthState]);

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
        const mockedAuthState = (
          window as {
            __FIREBASE_AUTH_STATE__?: {
              uid: string;
              email?: string;
            } | null;
          }
        ).__FIREBASE_AUTH_STATE__;

        if (mockedAuthState !== undefined) {
          (
            window as { __FIREBASE_AUTH_STATE__?: null }
          ).__FIREBASE_AUTH_STATE__ = null;
          setUser(null);
          return;
        }

        await firebaseSignOut(auth);
      },
    }),
    [user, isLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
