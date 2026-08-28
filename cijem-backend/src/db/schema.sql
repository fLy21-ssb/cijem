-- Esquema de base de datos CIJEM
-- Ejecutar contra la base PostgreSQL (Neon) configurada en DATABASE_URL.
-- Uso: psql "$DATABASE_URL" -f src/db/schema.sql

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'Gestor', -- 'Administrador' | 'Gestor'
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Indicadores / metas
CREATE TABLE IF NOT EXISTS indicadores (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER,
    meta_anual NUMERIC NOT NULL,
    avance_actual NUMERIC DEFAULT 0,
    unidad_medida VARCHAR(50),
    frecuencia_medicion VARCHAR(30), -- 'Mensual' | 'Trimestral' | 'Anual'
    fecha_inicio DATE DEFAULT '2026-01-01',
    fecha_termino DATE DEFAULT '2026-12-31',
    responsable_id INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Auditoría / trazabilidad
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    usuario_nombre VARCHAR(150),
    accion VARCHAR(20) NOT NULL, -- 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'CARGA_MASIVA'
    tabla_afectada VARCHAR(50) NOT NULL DEFAULT 'indicadores',
    registro_id INTEGER,
    detalle JSONB,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Historial de avances por fecha (soporte para el módulo de proyecciones,
-- sección 5.8/7.4 del prompt de especificación). Cada carga manual o masiva
-- que modifica avance_actual deja un registro aquí, lo que permite calcular
-- una tendencia lineal simple y proyectar el cierre de diciembre.
CREATE TABLE IF NOT EXISTS historial_avances (
    id SERIAL PRIMARY KEY,
    indicador_id INTEGER NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
    avance_delta NUMERIC NOT NULL,
    avance_acumulado NUMERIC NOT NULL,
    origen VARCHAR(20) NOT NULL, -- 'MANUAL' | 'CARGA_MASIVA'
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_indicador ON historial_avances(indicador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);
