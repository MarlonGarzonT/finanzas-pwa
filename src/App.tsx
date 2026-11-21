import { App as AppKonsta } from 'konsta/react';
import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './auth/Login';
import { RestablecerPassword } from './auth/RestablecerPassword';
import { BarraPestanas } from './components/BarraPestanas';
import { Cargando } from './components/Cargando';
import { AvisoActualizacion } from './components/AvisoActualizacion';
import { LimiteDeError } from './components/LimiteDeError';
import { FinanzasProvider } from './data/FinanzasContext';
import { Inicio } from './pages/Inicio';

// Inicio (el Resumen del celular) es la pantalla de entrada y va en el bundle
// principal; el resto se carga al abrir su pestaña.
const Historial = lazy(() => import('./pages/Historial').then((m) => ({ default: m.Historial })));
const cargarReportes = () => import('./pages/Reportes');
const Reportes = lazy(() => cargarReportes().then((m) => ({ default: m.Reportes })));
const Prestamos = lazy(() => import('./pages/Prestamos').then((m) => ({ default: m.Prestamos })));
const Perfil = lazy(() => import('./pages/Perfil').then((m) => ({ default: m.Perfil })));

function AppShell() {
  const { session, cargando, modoRecuperacion } = useAuth();
  const hayHoja = Boolean(session) && !cargando && !modoRecuperacion;

  // Reportes es la pestaña más pesada (gráficas): se descarga en segundo plano
  // apenas la app está lista y en reposo, así al tocarla ya está en el teléfono.
  useEffect(() => {
    if (!hayHoja) return;
    const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexion?.saveData) return;
    // Safari no tiene requestIdleCallback: ahí se espera un par de segundos.
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => void cargarReportes(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => void cargarReportes(), 2000);
    return () => clearTimeout(id);
  }, [hayHoja]);

  if (cargando) {
    return (
      <div className="flex h-full">
        <Cargando />
      </div>
    );
  }

  // Se revisa antes que la sesión: el enlace de "restablecer contraseña" ya
  // deja una sesión activa, pero el usuario debe fijar la contraseña nueva
  // antes de entrar a la app.
  if (modoRecuperacion) {
    return <RestablecerPassword />;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <FinanzasProvider>
      <HashRouter>
        <LimiteDeError>
          <Suspense fallback={<Cargando />}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/prestamos" element={<Prestamos />} />
              <Route path="/perfil" element={<Perfil />} />
            </Routes>
          </Suspense>
        </LimiteDeError>
        <BarraPestanas />
      </HashRouter>
    </FinanzasProvider>
  );
}

export default function App() {
  return (
    <AppKonsta theme="ios" safeAreas className="h-full min-h-0">
      <AuthProvider>
        <AppShell />
      </AuthProvider>
      {/* Las hojas inferiores y alertas se dibujan aquí (portal), dentro del
          contexto de Konsta pero fuera de cualquier pantalla con transform. */}
      <div id="capa-hojas" />
      <AvisoActualizacion />
    </AppKonsta>
  );
}
