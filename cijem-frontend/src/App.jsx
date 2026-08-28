import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import CargarDatos from './pages/CargarDatos';
import Metas from './pages/Metas';
import Auditoria from './pages/Auditoria';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Usuarios from './pages/Usuarios';

const RutaProtegida = ({ children }) => {
  const { estaAutenticado } = useAuth();
  return estaAutenticado ? children : <Navigate to="/login" replace />;
};

const RutaAdministrador = ({ children }) => {
  const { esAdministrador } = useAuth();
  return esAdministrador ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route path="/" element={<Inicio />} />
        <Route path="/cargar-datos" element={<CargarDatos />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route
          path="/usuarios"
          element={
            <RutaAdministrador>
              <Usuarios />
            </RutaAdministrador>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
