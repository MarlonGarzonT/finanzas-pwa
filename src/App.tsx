import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './auth/Login';
import { Spinner } from './components/Spinner';
import { FinanzasProvider } from './data/FinanzasContext';
import { GruposProvider } from './data/GruposContext';
import { GrupoDetalle } from './pages/GrupoDetalle';
import { Grupos } from './pages/Grupos';
import { Historial } from './pages/Historial';
import { Resumen } from './pages/Resumen';

function AppShell() {
  const { session, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="app-cargando">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <FinanzasProvider>
      <GruposProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Resumen />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/grupos/:id" element={<GrupoDetalle />} />
          </Routes>
        </HashRouter>
      </GruposProvider>
    </FinanzasProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
