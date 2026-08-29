const xlsx = require('xlsx');
const pool = require('../config/db');
const { calcularSemaforo, ESTADOS } = require('../utils/semaforo');
const { registrarAuditoria } = require('../middleware/auditoria');

function conSemaforo(indicador) {
  const semaforo = calcularSemaforo(indicador);
  return {
    ...indicador,
    meta_anual: Number(indicador.meta_anual),
    avance_actual: Number(indicador.avance_actual),
    estado: semaforo.estado,
    estado_label: semaforo.estadoLabel,
    porcentaje_cumplimiento: semaforo.porcentajeCumplimiento,
    porcentaje_esperado: semaforo.porcentajeEsperado,
    ratio_cumplimiento: semaforo.ratioCumplimiento,
  };
}

// Listado completo de indicadores con estado de semáforo calculado.
const listarIndicadores = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM indicadores ORDER BY id DESC');
    res.json({ exito: true, data: rows.map(conSemaforo) });
  } catch (error) {
    console.error('Error listando indicadores:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// Resumen para el panel de control: avance global, conteo de críticos,
// top 5 más atrasados y notificaciones (indicadores en estado Crítico).
const resumenDashboard = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM indicadores ORDER BY id DESC');
    const indicadores = rows.map(conSemaforo);

    const avanceGlobal = indicadores.length
      ? Math.round(indicadores.reduce((acc, i) => acc + i.porcentaje_cumplimiento, 0) / indicadores.length)
      : 0;

    const criticos = indicadores.filter((i) => i.estado === ESTADOS.ROJO);
    const alertas = indicadores.filter((i) => i.estado === ESTADOS.AMARILLO);

    const masAtrasados = [...indicadores]
      .sort((a, b) => a.ratio_cumplimiento - b.ratio_cumplimiento)
      .slice(0, 5);

    res.json({
      exito: true,
      data: {
        avanceGlobal,
        totalIndicadores: indicadores.length,
        totalAlertas: alertas.length,
        totalCriticos: criticos.length,
        masAtrasados,
        notificaciones: criticos.map((i) => ({
          id: i.id,
          codigo_interno: i.codigo_interno,
          nombre: i.nombre,
          mensaje: `"${i.nombre}" está en estado Crítico (${i.porcentaje_cumplimiento}% de avance vs ${i.porcentaje_esperado}% esperado).`,
        })),
      },
    });
  } catch (error) {
    console.error('Error calculando resumen:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const crearMeta = async (req, res) => {
  try {
    const {
      codigo_interno,
      nombre,
      descripcion = null,
      categoria_id = null,
      meta_anual,
      unidad_medida = null,
      frecuencia_medicion,
      fecha_inicio = '2026-01-01',
      fecha_termino = '2026-12-31',
    } = req.body;

    if (!codigo_interno || !nombre || meta_anual === undefined || !frecuencia_medicion) {
      return res.status(400).json({ exito: false, mensaje: 'codigo_interno, nombre, meta_anual y frecuencia_medicion son obligatorios.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO indicadores
        (codigo_interno, nombre, descripcion, categoria_id, meta_anual, avance_actual, unidad_medida, frecuencia_medicion, fecha_inicio, fecha_termino, responsable_id)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10) RETURNING *`,
      [codigo_interno, nombre, descripcion, categoria_id, meta_anual, unidad_medida, frecuencia_medicion, fecha_inicio, fecha_termino, req.usuario.id]
    );

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'CREAR',
      registroId: rows[0].id,
      detalle: { codigo_interno, nombre, meta_anual, frecuencia_medicion },
    });

    res.status(201).json({ exito: true, data: conSemaforo(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ exito: false, mensaje: 'Código interno duplicado.' });
    console.error('Error creando indicador:', error);
    res.status(500).json({ exito: false, mensaje: 'Error de escritura.' });
  }
};

const editarMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, meta_anual, unidad_medida, frecuencia_medicion, fecha_inicio, fecha_termino } = req.body;

    const { rows } = await pool.query(
      `UPDATE indicadores SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        meta_anual = COALESCE($3, meta_anual),
        unidad_medida = COALESCE($4, unidad_medida),
        frecuencia_medicion = COALESCE($5, frecuencia_medicion),
        fecha_inicio = COALESCE($6, fecha_inicio),
        fecha_termino = COALESCE($7, fecha_termino)
       WHERE id = $8 RETURNING *`,
      [nombre, descripcion, meta_anual, unidad_medida, frecuencia_medicion, fecha_inicio, fecha_termino, id]
    );

    if (rows.length === 0) return res.status(404).json({ exito: false, mensaje: 'Indicador no encontrado.' });

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'EDITAR',
      registroId: Number(id),
      detalle: req.body,
    });

    res.json({ exito: true, data: conSemaforo(rows[0]) });
  } catch (error) {
    console.error('Error editando indicador:', error);
    res.status(500).json({ exito: false, mensaje: 'Error actualizando registro.' });
  }
};

const eliminarMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM indicadores WHERE id = $1 RETURNING codigo_interno, nombre', [id]);
    if (rows.length === 0) return res.status(404).json({ exito: false, mensaje: 'Indicador no encontrado.' });

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'ELIMINAR',
      registroId: Number(id),
      detalle: rows[0],
    });

    res.json({ exito: true, mensaje: 'Registro eliminado.' });
  } catch (error) {
    console.error('Error eliminando indicador:', error);
    res.status(500).json({ exito: false, mensaje: 'Error de integridad referencial.' });
  }
};

// Carga manual: suma (o resta, si delta es negativo) un valor al avance
// actual de un indicador puntual, dejando huella en historial_avances.
const cargarAvanceManual = async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta)) {
      return res.status(400).json({ exito: false, mensaje: 'delta debe ser un número.' });
    }

    await cliente.query('BEGIN');
    const { rows } = await cliente.query(
      'UPDATE indicadores SET avance_actual = avance_actual + $1 WHERE id = $2 RETURNING *',
      [delta, id]
    );
    if (rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ exito: false, mensaje: 'Indicador no encontrado.' });
    }

    await cliente.query(
      `INSERT INTO historial_avances (indicador_id, avance_delta, avance_acumulado, origen, usuario_id)
       VALUES ($1, $2, $3, 'MANUAL', $4)`,
      [id, delta, rows[0].avance_actual, req.usuario.id]
    );

    await cliente.query('COMMIT');

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'EDITAR',
      registroId: Number(id),
      detalle: { tipo: 'carga_manual', delta, avance_resultante: rows[0].avance_actual },
    });

    res.json({ exito: true, data: conSemaforo(rows[0]) });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error en carga manual:', error);
    res.status(500).json({ exito: false, mensaje: 'Error actualizando el avance.' });
  } finally {
    cliente.release();
  }
};

// Carga masiva: procesa un Excel/CSV con columnas codigo_interno y avance.
// Usa TRIM() en la comparación para tolerar espacios y reporta exactamente
// cuántas filas se actualizaron de verdad y qué códigos no se encontraron.
const procesarCargaMasiva = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ exito: false, mensaje: 'Archivo no proporcionado.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const datosExcel = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    if (datosExcel.length === 0) return res.status(400).json({ exito: false, mensaje: 'Archivo vacío.' });

    const filasValidas = datosExcel.filter(
      (fila) => fila.codigo_interno !== undefined && fila.codigo_interno !== null && fila.avance !== undefined && fila.avance !== ''
    );

    const actualizados = [];
    const noEncontrados = [];

    for (const fila of filasValidas) {
      const codigo = String(fila.codigo_interno).trim();
      const avance = Number(fila.avance);
      if (!codigo || !Number.isFinite(avance)) {
        noEncontrados.push(String(fila.codigo_interno));
        continue;
      }

      const { rows } = await pool.query(
        `UPDATE indicadores SET avance_actual = avance_actual + $1
         WHERE TRIM(codigo_interno) = $2 RETURNING id, avance_actual`,
        [avance, codigo]
      );

      if (rows.length === 0) {
        noEncontrados.push(codigo);
        continue;
      }

      await pool.query(
        `INSERT INTO historial_avances (indicador_id, avance_delta, avance_acumulado, origen, usuario_id)
         VALUES ($1, $2, $3, 'CARGA_MASIVA', $4)`,
        [rows[0].id, avance, rows[0].avance_actual, req.usuario.id]
      );

      actualizados.push(codigo);
    }

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'CARGA_MASIVA',
      detalle: {
        archivo: req.file.originalname,
        filas_totales: datosExcel.length,
        filas_actualizadas: actualizados.length,
        codigos_no_encontrados: noEncontrados,
      },
    });

    res.json({
      exito: true,
      mensaje: `Procesamiento completado. ${actualizados.length} de ${datosExcel.length} filas actualizaron un indicador existente.`,
      data: {
        filasTotales: datosExcel.length,
        filasActualizadas: actualizados.length,
        codigosNoEncontrados: [...new Set(noEncontrados)],
      },
    });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ exito: false, mensaje: 'Fallo en la lectura del documento.' });
  }
};

// Proyección lineal simple: usa el historial de avances para estimar la
// tendencia diaria y proyectar el valor de cierre al final del periodo.
const proyeccionIndicador = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: indicadorRows } = await pool.query('SELECT * FROM indicadores WHERE id = $1', [id]);
    if (indicadorRows.length === 0) return res.status(404).json({ exito: false, mensaje: 'Indicador no encontrado.' });
    const indicador = indicadorRows[0];

    const { rows: historial } = await pool.query(
      'SELECT fecha, avance_acumulado FROM historial_avances WHERE indicador_id = $1 ORDER BY fecha ASC',
      [id]
    );

    if (historial.length < 2) {
      return res.json({
        exito: true,
        data: {
          suficienteHistorial: false,
          mensaje: 'Se necesitan al menos dos registros de avance en fechas distintas para proyectar una tendencia.',
        },
      });
    }

    // Regresión lineal simple (mínimos cuadrados) sobre días transcurridos desde el primer registro.
    const t0 = new Date(historial[0].fecha).getTime();
    const puntos = historial.map((h) => ({
      x: (new Date(h.fecha).getTime() - t0) / 86400000, // días
      y: Number(h.avance_acumulado),
    }));

    // Si todos los registros caen dentro de un mismo día, la pendiente diaria
    // no es representativa (un par de cargas seguidas en minutos puede dar una
    // tasa "por día" absurda). Se exige al menos 1 día completo de separación.
    const spanDias = puntos[puntos.length - 1].x - puntos[0].x;
    if (spanDias < 1) {
      return res.json({
        exito: true,
        data: {
          suficienteHistorial: false,
          mensaje: 'Los registros de avance disponibles son del mismo día. Se necesita historial repartido en al menos dos fechas distintas para proyectar una tendencia confiable.',
        },
      });
    }

    const n = puntos.length;
    const sumaX = puntos.reduce((a, p) => a + p.x, 0);
    const sumaY = puntos.reduce((a, p) => a + p.y, 0);
    const sumaXY = puntos.reduce((a, p) => a + p.x * p.y, 0);
    const sumaX2 = puntos.reduce((a, p) => a + p.x * p.x, 0);

    const denominador = n * sumaX2 - sumaX * sumaX;
    const pendiente = denominador !== 0 ? (n * sumaXY - sumaX * sumaY) / denominador : 0;
    const intercepto = (sumaY - pendiente * sumaX) / n;

    const fechaTermino = new Date(indicador.fecha_termino);
    const diasHastaTermino = (fechaTermino.getTime() - t0) / 86400000;
    const proyeccionCierre = pendiente * diasHastaTermino + intercepto;
    const metaAnual = Number(indicador.meta_anual);

    res.json({
      exito: true,
      data: {
        suficienteHistorial: true,
        avanceActual: Number(indicador.avance_actual),
        metaAnual,
        pendienteDiaria: pendiente,
        proyeccionCierre: Math.max(0, proyeccionCierre),
        alcanzaMeta: proyeccionCierre >= metaAnual,
        fechaTermino: indicador.fecha_termino,
      },
    });
  } catch (error) {
    console.error('Error calculando proyección:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = {
  listarIndicadores,
  resumenDashboard,
  crearMeta,
  editarMeta,
  eliminarMeta,
  cargarAvanceManual,
  procesarCargaMasiva,
  proyeccionIndicador,
};
