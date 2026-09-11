import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dbGrupos from '../dbGrupos';
import type { Grupo } from '../types';

interface GruposContextValue {
  grupos: Grupo[];
  cargando: boolean;
  crearGrupo: (nombre: string, nombreVisible: string) => Promise<Grupo>;
  unirseAGrupo: (codigo: string, nombreVisible: string) => Promise<Grupo>;
}

const GruposContext = createContext<GruposContextValue | undefined>(undefined);

export function GruposProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    const lista = await dbGrupos.obtenerGrupos(userId);
    setGrupos(lista);
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    if (userId) cargarTodo();
  }, [userId, cargarTodo]);

  async function crearGrupo(nombre: string, nombreVisible: string) {
    const nuevo = await dbGrupos.crearGrupo(nombre, nombreVisible);
    setGrupos((prev) => [nuevo, ...prev]);
    return nuevo;
  }

  async function unirseAGrupo(codigo: string, nombreVisible: string) {
    const grupo = await dbGrupos.unirseAGrupo(codigo, nombreVisible);
    setGrupos((prev) => (prev.some((g) => g.id === grupo.id) ? prev : [grupo, ...prev]));
    return grupo;
  }

  return (
    <GruposContext.Provider value={{ grupos, cargando, crearGrupo, unirseAGrupo }}>
      {children}
    </GruposContext.Provider>
  );
}

export function useGrupos() {
  const ctx = useContext(GruposContext);
  if (!ctx) throw new Error('useGrupos debe usarse dentro de GruposProvider');
  return ctx;
}
