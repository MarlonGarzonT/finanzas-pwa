import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextValue {
  session: Session | null;
  cargando: boolean;
  registrar: (email: string, password: string) => Promise<{ error: string | null; requiereConfirmacion: boolean }>;
  iniciarSesion: (email: string, password: string) => Promise<{ error: string | null }>;
  iniciarSesionConGoogle: () => Promise<{ error: string | null }>;
  restablecerPassword: (email: string) => Promise<{ error: string | null }>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setCargando(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSession) => {
      setSession(nuevaSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function registrar(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, requiereConfirmacion: false };
    // Supabase no devuelve error si el correo ya existe (para no revelar cuentas registradas):
    // en ese caso el usuario devuelto trae identities vacío y no se crea sesión.
    if (data.user && data.user.identities?.length === 0) {
      return {
        error: 'Ya existe una cuenta con ese correo. Inicia sesión en su lugar.',
        requiereConfirmacion: false,
      };
    }
    // Si el proyecto de Supabase exige confirmar el correo (comportamiento por
    // defecto), la cuenta queda creada pero sin sesión activa hasta que el
    // usuario confirme desde el correo que le llega. Sin avisar esto, el
    // formulario parece "no hacer nada" y el usuario reintenta, chocando con
    // el rate-limit de Supabase para reenvíos ("for security purposes...").
    const requiereConfirmacion = data.user !== null && data.session === null;
    return { error: null, requiereConfirmacion };
  }

  async function iniciarSesion(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  // Redirige a Google; si no hay error inmediato el navegador ya está
  // navegando fuera de la app, así que no hay sesión que devolver aquí - la
  // recoge el listener de onAuthStateChange cuando el usuario vuelve.
  async function iniciarSesionConGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    return { error: error?.message ?? null };
  }

  async function restablecerPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
    });
    return { error: error?.message ?? null };
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, cargando, registrar, iniciarSesion, iniciarSesionConGoogle, restablecerPassword, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
