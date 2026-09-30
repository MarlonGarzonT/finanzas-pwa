import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextValue {
  session: Session | null;
  cargando: boolean;
  // true cuando la sesión activa viene del enlace de "restablecer contraseña"
  // (evento PASSWORD_RECOVERY de Supabase): en ese caso hay que pedir la
  // contraseña nueva antes de dejar entrar a la app, aunque ya exista sesión.
  modoRecuperacion: boolean;
  registrar: (email: string, password: string) => Promise<{ error: string | null; requiereConfirmacion: boolean }>;
  iniciarSesion: (email: string, password: string) => Promise<{ error: string | null }>;
  iniciarSesionConGoogle: () => Promise<{ error: string | null }>;
  restablecerPassword: (email: string) => Promise<{ error: string | null }>;
  actualizarPassword: (password: string) => Promise<{ error: string | null }>;
  cancelarRecuperacion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoRecuperacion, setModoRecuperacion] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setCargando(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, nuevaSession) => {
      setSession(nuevaSession);
      if (event === 'PASSWORD_RECOVERY') setModoRecuperacion(true);
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

  async function actualizarPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setModoRecuperacion(false);
    return { error: error?.message ?? null };
  }

  // Si el usuario abrió el enlace de recuperación y se arrepiente, no debe
  // quedar con una sesión "a medias": se cierra por completo y vuelve al login.
  async function cancelarRecuperacion() {
    setModoRecuperacion(false);
    await supabase.auth.signOut();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        cargando,
        modoRecuperacion,
        registrar,
        iniciarSesion,
        iniciarSesionConGoogle,
        restablecerPassword,
        actualizarPassword,
        cancelarRecuperacion,
        cerrarSesion,
      }}
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
