import { App as AppKonsta } from 'konsta/react';
import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './auth/Login';
import { RestablecerPassword } from './auth/RestablecerPassword';
import { BarraPestanas } from './components/BarraPestanas';
import { Cargando } from './components/Cargando';
import { AvisoActualizacion } from './components/AvisoActualizacion';
import { LimiteDeError } from './components/LimiteDeError';
import { FinanzasProvider } from './data/FinanzasContext';
import { Resumen } from './pages/Resumen';

// Resumen es la pantalla de entrada y va en el bundle principal; el resto se
// carga al abrir su pestaña.
const Historial = lazy(() => import('./pages/Historial').then((m) => ({ default: m.Historial })));
const Reportes = lazy(() => import('./pages/Reportes').then((m) => ({ default: m.Reportes })));
const Prestamos = lazy(() => import('./pages/Prestamos').then((m) => ({ default: m.Prestamos })));
const Perfil = lazy(() => import('./pages/Perfil').then((m) => ({ default: m.Perfil })));

function AppShell() {
  const { session, cargando, modoRecuperacion } = useAuth();

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
              <Route path="/" element={<Resumen />} />
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
