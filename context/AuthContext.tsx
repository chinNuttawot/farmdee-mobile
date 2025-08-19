import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthState {
  user: { id: number; name: string; role: "owner" | "worker" } | null;
  login: (email: string, pwd: string) => Promise<void>;
  logout: () => void;
}
const Ctx = createContext<AuthState | undefined>(undefined);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside");
  return v;
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const login = async (email: string) => {
    const role = email.includes("owner") ? "owner" : "worker";
    setUser({ id: 1, name: "Demo User", role });
  };
  const logout = () => setUser(null);
  return (
    <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
  );
}
