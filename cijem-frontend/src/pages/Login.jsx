import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoJunji from '../assets/junji.png';
import { useAuth } from '../context/useAuth';

const Login = () => {
  const [credenciales, setCredenciales] = useState({ rut: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(credenciales.rut, credenciales.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logoJunji} alt="Logo JUNJI" />
          <h2>Iniciar Sesión</h2>
          <p>CIJEM · Control de Gestión y Analítica de Datos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>RUT de Usuario</label>
            <input
              type="text"
              name="rut"
              value={credenciales.rut}
              onChange={handleChange}
              placeholder="Ej: 12345678-9"
              className="form-control"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={credenciales.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="form-control"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
