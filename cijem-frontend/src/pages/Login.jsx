import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoJunji from '../assets/junji.png';

const Login = () => {
  const [credenciales, setCredenciales] = useState({ rut: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectaremos con el backend real. Por ahora, validación dura para avanzar.
    if (credenciales.rut === 'admin' && credenciales.password === '1234') {
      localStorage.setItem('token', 'simulacion-jwt-token');
      navigate('/dashboard');
    } else {
      setError('Credenciales incorrectas. Intente nuevamente.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F4F7FE' }}>
      <div style={{ margin: 'auto', width: '400px', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src={logoJunji} alt="Logo JUNJI" style={{ maxWidth: '150px', marginBottom: '20px' }} />
          <h2 style={{ color: '#1A3668', fontSize: '24px', fontWeight: '700' }}>Iniciar Sesión</h2>
          <p style={{ color: '#A3AED0', fontSize: '14px' }}>Ingrese sus credenciales de acceso</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2B3674' }}>RUT de Usuario</label>
            <input 
              type="text" 
              name="rut"
              onChange={handleChange}
              placeholder="Ej: 12345678-9"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E0E5F2', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2B3674' }}>Contraseña</label>
            <input 
              type="password" 
              name="password"
              onChange={handleChange}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E0E5F2', outline: 'none' }}
              required
            />
          </div>

          {error && <p style={{ color: '#EE5D50', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" style={{ backgroundColor: '#1A3668', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }}>
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;