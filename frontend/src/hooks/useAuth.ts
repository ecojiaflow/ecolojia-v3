// PATH: frontend/src/hooks/useAuth.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/api";
interface User { id: string; email: string; subscription?: { tier?: string; }; quotas?: any; }

export function useAuth(){
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const isAuthenticated = !!user;

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try{ const u = await authService.login({ email, password }); setUser(u); return u; }
    catch(e:any){ setError(e?.message||"Impossible de se connecter"); throw e; }
    finally{ setLoading(false); }
  },[]);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try{ const u = await authService.register({ email, password }); setUser(u); return u; }
    catch(e:any){ setError(e?.message||"Inscription impossible"); throw e; }
    finally{ setLoading(false); }
  },[]);

  const logout = useCallback(()=>{ localStorage.clear(); setUser(null); },[]);

  useEffect(()=>{ (async()=>{ if(!localStorage.getItem("token")) return; try{ /* refresh disabled */ setUser(null); }catch{ localStorage.clear(); setUser(null);} })();},[]);

  return useMemo(()=>({ user, loading, error, isAuthenticated, login, register, logout, isPremium: user?.subscription?.tier === "premium" }),[user,loading,error,isAuthenticated,login,register,logout]);
}
