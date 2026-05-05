import { AuthProvider } from "../features/auth/AuthContext";

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
