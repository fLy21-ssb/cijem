// Motor de reglas de negocio: cálculo de semáforo de cumplimiento.
//
// Función pura, sin dependencias de base de datos ni de Express, para que
// sea fácil de testear de forma aislada (ver semaforo.test.js).

const ESTADOS = Object.freeze({
  VERDE: 'Verde',
  AMARILLO: 'Amarillo',
  ROJO: 'Rojo',
});

const ETIQUETAS_INSTITUCIONALES = Object.freeze({
  [ESTADOS.VERDE]: 'Normal',
  [ESTADOS.AMARILLO]: 'Alerta',
  [ESTADOS.ROJO]: 'Crítico',
});

function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor);
}

/**
 * Calcula el estado de semáforo de un indicador comparando el avance real
 * contra el avance esperado a la fecha (no solo avance / meta).
 *
 * @param {{meta_anual:number, avance_actual:number, fecha_inicio:string|Date, fecha_termino:string|Date}} indicador
 * @param {Date} [fechaReferencia] fecha contra la que se evalúa (por defecto, hoy)
 */
function calcularSemaforo(indicador, fechaReferencia = new Date()) {
  const metaAnual = Number(indicador.meta_anual) || 0;
  const avanceActual = Number(indicador.avance_actual) || 0;
  const fechaInicio = aFecha(indicador.fecha_inicio);
  const fechaTermino = aFecha(indicador.fecha_termino);
  const hoy = aFecha(fechaReferencia);

  const duracionTotalMs = fechaTermino.getTime() - fechaInicio.getTime();
  const transcurridoMs = hoy.getTime() - fechaInicio.getTime();

  let fraccionTiempo = duracionTotalMs > 0 ? transcurridoMs / duracionTotalMs : 1;
  fraccionTiempo = Math.min(1, Math.max(0, fraccionTiempo));

  // Mínimo 0.01 para evitar división por cero al inicio del periodo.
  const avanceEsperado = Math.max(0.01, fraccionTiempo);

  const porcentajeReal = metaAnual > 0 ? avanceActual / metaAnual : 0;
  const ratioCumplimiento = porcentajeReal / avanceEsperado;

  let estado;
  if (ratioCumplimiento >= 0.95) {
    estado = ESTADOS.VERDE;
  } else if (ratioCumplimiento >= 0.75) {
    estado = ESTADOS.AMARILLO;
  } else {
    estado = ESTADOS.ROJO;
  }

  return {
    fraccionTiempo,
    avanceEsperado,
    porcentajeReal,
    ratioCumplimiento,
    estado,
    estadoLabel: ETIQUETAS_INSTITUCIONALES[estado],
    porcentajeCumplimiento: Math.round(porcentajeReal * 100),
    porcentajeEsperado: Math.round(avanceEsperado * 100),
  };
}

module.exports = { calcularSemaforo, ESTADOS, ETIQUETAS_INSTITUCIONALES };
