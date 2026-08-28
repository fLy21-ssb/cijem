const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularSemaforo, ESTADOS } = require('./semaforo');

const PERIODO_ANUAL = {
  fecha_inicio: '2026-01-01',
  fecha_termino: '2026-12-31',
};

test('indicador al día (avance = tiempo transcurrido) es Verde/Normal', () => {
  const referencia = new Date('2026-07-02'); // ~50% del año transcurrido
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 50 },
    referencia
  );
  assert.equal(resultado.estado, ESTADOS.VERDE);
  assert.equal(resultado.estadoLabel, 'Normal');
});

test('indicador moderadamente atrasado cae en Amarillo/Alerta', () => {
  const referencia = new Date('2026-07-02'); // ~50% del año transcurrido
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 40 }, // ratio 0.8
    referencia
  );
  assert.equal(resultado.estado, ESTADOS.AMARILLO);
});

test('indicador muy atrasado cae en Rojo/Crítico', () => {
  const referencia = new Date('2026-07-02');
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 10 },
    referencia
  );
  assert.equal(resultado.estado, ESTADOS.ROJO);
  assert.equal(resultado.estadoLabel, 'Crítico');
});

test('no divide por cero al inicio exacto del periodo', () => {
  const referencia = new Date('2026-01-01');
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 0 },
    referencia
  );
  assert.ok(Number.isFinite(resultado.ratioCumplimiento));
  assert.equal(resultado.avanceEsperado, 0.01);
});

test('avance que supera la meta esperada sigue siendo Verde (no se rompe sobre 100%)', () => {
  const referencia = new Date('2026-07-02');
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 90 },
    referencia
  );
  assert.equal(resultado.estado, ESTADOS.VERDE);
});

test('fecha de referencia posterior al término del periodo se acota a 100% de tiempo transcurrido', () => {
  const referencia = new Date('2027-03-01');
  const resultado = calcularSemaforo(
    { ...PERIODO_ANUAL, meta_anual: 100, avance_actual: 100 },
    referencia
  );
  assert.equal(resultado.fraccionTiempo, 1);
  assert.equal(resultado.estado, ESTADOS.VERDE);
});
