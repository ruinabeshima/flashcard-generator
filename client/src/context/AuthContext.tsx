import { createContext } from "react";

import type { User } from "firebase/auth";
type AuthContextValue = {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
