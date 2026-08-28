const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function obtenerToken() {
  return localStorage.getItem('token');
}

class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

async function solicitud(ruta, { method = 'GET', body, isFormData = false, isBlob = false } = {}) {
  const headers = {};
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (respuesta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError('Sesión expirada. Inicie sesión nuevamente.', 401);
  }

  if (isBlob) {
    if (!respuesta.ok) throw new ApiError('Error generando el archivo.', respuesta.status);
    return respuesta.blob();
  }

  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data.exito === false) {
    throw new ApiError(data.mensaje || 'Error de comunicación con el servidor.', respuesta.status);
  }
  return data;
}

export const api = {
  login: (rut, password) => solicitud('/api/auth/login', { method: 'POST', body: { rut, password } }),

  listarIndicadores: () => solicitud('/api/indicadores'),
  resumenDashboard: () => solicitud('/api/indicadores/resumen'),
  crearIndicador: (datos) => solicitud('/api/indicadores', { method: 'POST', body: datos }),
  editarIndicador: (id, datos) => solicitud(`/api/indicadores/${id}`, { method: 'PUT', body: datos }),
  eliminarIndicador: (id) => solicitud(`/api/indicadores/${id}`, { method: 'DELETE' }),
  cargarAvanceManual: (id, delta) => solicitud(`/api/indicadores/${id}/avance`, { method: 'PATCH', body: { delta } }),
  proyeccionIndicador: (id) => solicitud(`/api/indicadores/${id}/proyeccion`),
  cargaMasiva: (archivo) => {
    const formData = new FormData();
    formData.append('archivoExcel', archivo);
    return solicitud('/api/indicadores/carga-masiva', { method: 'POST', body: formData, isFormData: true });
  },

  listarAuditoria: (accion) => solicitud(`/api/auditoria${accion ? `?accion=${accion}` : ''}`),

  listarUsuarios: () => solicitud('/api/usuarios'),
  crearUsuario: (datos) => solicitud('/api/usuarios', { method: 'POST', body: datos }),

  descargarReportePdf: () => solicitud('/api/reportes/pdf', { isBlob: true }),
  descargarReporteExcel: () => solicitud('/api/reportes/excel', { isBlob: true }),
  enviarReportePorEmail: (destinatario, formato) =>
    solicitud('/api/reportes/email', { method: 'POST', body: { destinatario, formato } }),
};

export { ApiError, API_URL };
