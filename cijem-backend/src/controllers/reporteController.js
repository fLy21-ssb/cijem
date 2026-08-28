const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const pool = require('../config/db');
const { calcularSemaforo, ESTADOS } = require('../utils/semaforo');
const { enviarCorreo } = require('../services/mailer');

const COLOR_PRIMARIO = '#1A3668';
const COLOR_ACENTO = '#2E5AAC';
const COLOR_TEXTO = '#2B3674';
const COLOR_MUTED = '#666666';
const COLORES_ESTADO = {
  [ESTADOS.VERDE]: '#22A45D',
  [ESTADOS.AMARILLO]: '#F2B233',
  [ESTADOS.ROJO]: '#E2483D',
};

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'junji.png');

async function obtenerIndicadoresConEstado() {
  const { rows } = await pool.query('SELECT * FROM indicadores ORDER BY codigo_interno ASC');
  return rows.map((ind) => {
    const semaforo = calcularSemaforo(ind);
    return { ...ind, ...semaforo };
  });
}

function resumenDe(indicadores) {
  const total = indicadores.length;
  const avanceGlobal = total
    ? Math.round(indicadores.reduce((acc, i) => acc + i.porcentajeCumplimiento, 0) / total)
    : 0;
  const alertas = indicadores.filter((i) => i.estado === ESTADOS.AMARILLO).length;
  const criticos = indicadores.filter((i) => i.estado === ESTADOS.ROJO).length;
  return { total, avanceGlobal, alertas, criticos };
}

// Genera el PDF ejecutivo. IMPORTANTE: pdfkit mueve doc.y automáticamente
// tras cada .text(), lo que puede disparar saltos de página no deseados si
// se confía en ese cursor para calcular posiciones siguientes. Por eso aquí
// se lleva manualmente una variable `cursorY` propia para todo el layout.
function dibujarPdf(doc, indicadores) {
  const margenIzq = 50;
  const anchoUtil = doc.page.width - margenIzq * 2;
  let cursorY = 0;
  let numeroPagina = 1;

  const numerarPagina = () => {
    doc
      .fontSize(8)
      .fillColor(COLOR_MUTED)
      .text(`Página ${numeroPagina}`, margenIzq, doc.page.height - 40, { width: anchoUtil, align: 'center' });
  };

  const nuevaPagina = () => {
    numerarPagina();
    doc.addPage();
    numeroPagina += 1;
    cursorY = 50;
  };

  const asegurarEspacio = (alturaNecesaria) => {
    if (cursorY + alturaNecesaria > doc.page.height - 60) {
      nuevaPagina();
    }
  };

  // --- Encabezado institucional ---
  cursorY = 40;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, margenIzq, cursorY, { width: 48 });
    }
  } catch (_) {
    // Si el logo no se puede leer, se continúa el reporte sin bloquear la generación.
  }
  doc
    .fillColor(COLOR_PRIMARIO)
    .fontSize(18)
    .text('CIJEM — Reporte Ejecutivo de Cumplimiento', margenIzq + 60, cursorY, { width: anchoUtil - 60 });
  doc
    .fillColor(COLOR_MUTED)
    .fontSize(10)
    .text(`Unidad Regional JUNJI · Generado el ${new Date().toLocaleDateString('es-CL')}`, margenIzq + 60, cursorY + 24, {
      width: anchoUtil - 60,
    });

  cursorY += 70;
  doc.moveTo(margenIzq, cursorY).lineTo(margenIzq + anchoUtil, cursorY).strokeColor(COLOR_ACENTO).lineWidth(2).stroke();
  cursorY += 24;

  // --- Tarjetas resumen ---
  const resumen = resumenDe(indicadores);
  const tarjetas = [
    { titulo: 'Avance Global', valor: `${resumen.avanceGlobal}%` },
    { titulo: 'Total Indicadores', valor: `${resumen.total}` },
    { titulo: 'En Alerta', valor: `${resumen.alertas}` },
    { titulo: 'Críticos', valor: `${resumen.criticos}` },
  ];
  const anchoTarjeta = anchoUtil / tarjetas.length - 8;

  tarjetas.forEach((tarjeta, idx) => {
    const x = margenIzq + idx * (anchoTarjeta + 8);
    doc.roundedRect(x, cursorY, anchoTarjeta, 60, 6).fillAndStroke('#F4F7FE', '#E0E5F2');
    doc.fillColor(COLOR_MUTED).fontSize(9).text(tarjeta.titulo.toUpperCase(), x + 10, cursorY + 10, { width: anchoTarjeta - 20 });
    doc.fillColor(COLOR_PRIMARIO).fontSize(20).text(tarjeta.valor, x + 10, cursorY + 26, { width: anchoTarjeta - 20 });
  });

  cursorY += 84;

  // --- Tabla detallada ---
  const columnas = [
    { titulo: 'Código', ancho: 0.11 },
    { titulo: 'Nombre', ancho: 0.27 },
    { titulo: 'Meta', ancho: 0.09 },
    { titulo: 'Avance', ancho: 0.09 },
    { titulo: '% Cumpl.', ancho: 0.1 },
    { titulo: '% Esper.', ancho: 0.1 },
    { titulo: 'Frecuencia', ancho: 0.12 },
    { titulo: 'Estado', ancho: 0.12 },
  ];

  const dibujarEncabezadoTabla = () => {
    doc.fontSize(9).fillColor('#ffffff');
    doc.rect(margenIzq, cursorY, anchoUtil, 22).fill(COLOR_PRIMARIO);
    let x = margenIzq;
    columnas.forEach((col) => {
      const w = anchoUtil * col.ancho;
      doc.fillColor('#ffffff').text(col.titulo, x + 4, cursorY + 6, { width: w - 8 });
      x += w;
    });
    cursorY += 22;
  };

  asegurarEspacio(22);
  dibujarEncabezadoTabla();

  indicadores.forEach((ind, filaIdx) => {
    const alturaFila = 20;
    asegurarEspacio(alturaFila);
    if (cursorY === 50) dibujarEncabezadoTabla(); // se acaba de saltar de página

    if (filaIdx % 2 === 0) {
      doc.rect(margenIzq, cursorY, anchoUtil, alturaFila).fill('#F8F9FC');
    }

    const valores = [
      ind.codigo_interno,
      ind.nombre,
      String(Number(ind.meta_anual)),
      String(Number(ind.avance_actual)),
      `${ind.porcentajeCumplimiento}%`,
      `${ind.porcentajeEsperado}%`,
      ind.frecuencia_medicion || '-',
    ];

    let x = margenIzq;
    doc.fontSize(8).fillColor('#111111');
    columnas.slice(0, 7).forEach((col, i) => {
      const w = anchoUtil * col.ancho;
      doc.text(valores[i], x + 4, cursorY + 5, { width: w - 8, ellipsis: true });
      x += w;
    });

    // Badge de estado
    const wEstado = anchoUtil * columnas[7].ancho;
    doc
      .fillColor(COLORES_ESTADO[ind.estado] || COLOR_MUTED)
      .fontSize(8)
      .text(ind.estadoLabel, x + 4, cursorY + 5, { width: wEstado - 8 });

    cursorY += alturaFila;
  });

  numerarPagina();
}

const generarReportePdf = async (req, res) => {
  try {
    const indicadores = await obtenerIndicadoresConEstado();
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-cijem.pdf"');
    doc.pipe(res);

    dibujarPdf(doc, indicadores);
    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ exito: false, mensaje: 'Error generando el reporte PDF.' });
  }
};

function construirBufferPdf(indicadores) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    dibujarPdf(doc, indicadores);
    doc.end();
  });
}

function construirBufferExcel(indicadores) {
  const filas = indicadores.map((ind) => ({
    Código: ind.codigo_interno,
    Nombre: ind.nombre,
    Meta: Number(ind.meta_anual),
    Avance: Number(ind.avance_actual),
    '% Cumplimiento': ind.porcentajeCumplimiento,
    '% Esperado': ind.porcentajeEsperado,
    Frecuencia: ind.frecuencia_medicion,
    Estado: ind.estadoLabel,
  }));
  const hoja = xlsx.utils.json_to_sheet(filas);
  const libro = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(libro, hoja, 'Indicadores');
  return xlsx.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

const generarReporteExcel = async (req, res) => {
  try {
    const indicadores = await obtenerIndicadoresConEstado();
    const buffer = construirBufferExcel(indicadores);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-cijem.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ exito: false, mensaje: 'Error generando el reporte Excel.' });
  }
};

const enviarReportePorCorreo = async (req, res) => {
  try {
    const { destinatario, formato = 'pdf' } = req.body;
    if (!destinatario) {
      return res.status(400).json({ exito: false, mensaje: 'Debe indicar un destinatario.' });
    }
    if (!['pdf', 'excel'].includes(formato)) {
      return res.status(400).json({ exito: false, mensaje: 'Formato inválido. Use "pdf" o "excel".' });
    }

    const indicadores = await obtenerIndicadoresConEstado();
    const resumen = resumenDe(indicadores);

    let adjunto;
    if (formato === 'pdf') {
      adjunto = { filename: 'reporte-cijem.pdf', content: await construirBufferPdf(indicadores), contentType: 'application/pdf' };
    } else {
      adjunto = {
        filename: 'reporte-cijem.xlsx',
        content: construirBufferExcel(indicadores),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const resultado = await enviarCorreo({
      para: destinatario,
      asunto: 'Reporte Ejecutivo CIJEM — Unidad Regional JUNJI',
      texto: `Se adjunta el reporte ejecutivo de cumplimiento de metas.\n\nAvance global: ${resumen.avanceGlobal}%\nIndicadores en alerta: ${resumen.alertas}\nIndicadores críticos: ${resumen.criticos}`,
      adjuntos: [adjunto],
    });

    if (!resultado.enviado) {
      return res.status(503).json({ exito: false, mensaje: 'El servicio de correo no está configurado en este servidor (falta SMTP_HOST/SMTP_USER/SMTP_PASS).' });
    }

    res.json({ exito: true, mensaje: `Reporte enviado a ${destinatario}.` });
  } catch (error) {
    console.error('Error enviando reporte por correo:', error);
    res.status(500).json({ exito: false, mensaje: 'Error enviando el reporte por correo.' });
  }
};

module.exports = { generarReportePdf, generarReporteExcel, enviarReportePorCorreo };
