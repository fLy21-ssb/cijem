import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { AuthContext } from './authContextCore';

function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem('usuario');
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = useCallback(async (rut, password) => {
    const data = await api.login(rut, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  const value = {
    usuario,
    token,
    login,
    logout,
    estaAutenticado: !!token,
    esAdministrador: usuario?.rol === 'Administrador',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
