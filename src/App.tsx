import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './auth/Login';
import { Spinner } from './components/Spinner';
import { FinanzasProvider } from './data/FinanzasContext';
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
      <HashRouter>
        <Routes>
          <Route path="/" element={<Resumen />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </HashRouter>
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
