import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// 🛡️ Este es el "Guardián" que revisa el token en tiempo real
const RutaProtegida = ({ children }) => {
  const estaAutenticado = !!localStorage.getItem('token');
  return estaAutenticado ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Ruta privada protegida por el Guardián */}
        <Route 
          path="/dashboard" 
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;