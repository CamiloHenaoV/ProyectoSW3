/**
 * API simulada para desarrollar y probar el frontend sin el backend real.
 * Implementa los contratos de docs/contratos-api-segundo-corte.md.
 * Requiere Keycloak en marcha (docker compose up -d keycloak): no valida la firma
 * del token, solo lee sus roles y claims. NUNCA usar fuera de desarrollo.
 *
 * Uso: npm run mock-api   (escucha en http://localhost:5039)
 */
const http = require('http');
const url = require('url');

const medicos = [
  { id: '650000000000000000000001', nombre: 'Dra. Ana Restrepo', especialidad: 'Medicina General', activo: true },
  { id: '650000000000000000000002', nombre: 'Dr. Julián Torres', especialidad: 'Terapia Física', activo: true }
];
const M1 = '650000000000000000000001';
const M2 = '650000000000000000000002';
const pacientes = [
  { id: 'p1', nombre: 'Carlos Pérez', documentoIdentidad: '1032456789' },
  { id: 'p2', nombre: 'Juan Pérez Gómez', documentoIdentidad: '1061000234' },
  { id: 'p3', nombre: 'María Fernanda López', documentoIdentidad: '1061002345' },
  { id: 'p4', nombre: 'Andrés Ruiz Caicedo', documentoIdentidad: '1062456789' },
  { id: 'p5', nombre: 'Carmen Muñoz', documentoIdentidad: '10345678' },
  { id: 'p6', nombre: 'Óscar Hurtado', documentoIdentidad: '1061009876' }
];
const iso = (d) => d.toISOString().substring(0, 10);
const hoy = new Date(Date.now() - 5 * 3600 * 1000); // Colombia
const dia = (n) => { const d = new Date(hoy); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
let seq = 100;
const cita = (medicoId, fecha, hora, pacienteId, estado = 'Agendada') => {
  const p = pacientes.find((x) => x.id === pacienteId);
  const m = medicos.find((x) => x.id === medicoId);
  const [h, mm] = hora.split(':').map(Number);
  const fin = `${String(h + Math.floor((mm + 30) / 60)).padStart(2, '0')}:${String((mm + 30) % 60).padStart(2, '0')}:00`;
  return { id: 'c' + seq++, medicoId, nombreMedico: m.nombre, especialidadMedico: m.especialidad, fecha: fecha + 'T00:00:00',
    horaInicio: hora + ':00', horaFin: fin, estado, pacienteId, pacienteNombre: p.nombre, pacienteDocumento: p.documentoIdentidad };
};
const citas = [
  cita(M1, dia(0), '08:00', 'p2', 'Atendida'), cita(M1, dia(0), '08:30', 'p3', 'Atendida'),
  cita(M1, dia(0), '09:00', 'p4', 'Cancelada'), cita(M1, dia(0), '09:30', 'p5'),
  cita(M1, dia(0), '10:00', 'p6'), cita(M1, dia(0), '10:30', 'p1'), cita(M1, dia(0), '11:00', 'p2'),
  cita(M1, dia(3), '08:00', 'p2'), cita(M2, dia(-20), '14:00', 'p2', 'Atendida'),
  cita(M1, dia(-45), '09:00', 'p2', 'Atendida'), cita(M2, dia(-10), '15:00', 'p2', 'Cancelada'),
  cita(M1, dia(-3), '08:00', 'p1', 'Atendida')
];
const config = [
  { id: 'cf1', medicoId: M1, diasAtencion: [1, 2, 3, 4, 5], horaInicio: '08:00:00', horaFin: '12:00:00', intervaloMinutos: 30, semanasHabilitadas: 4 },
  { id: 'cf2', medicoId: M2, diasAtencion: [1, 3, 5], horaInicio: '14:00:00', horaFin: '18:00:00', intervaloMinutos: 20, semanasHabilitadas: 6 }
];
// RF7: historial sintético (determinista) para que el reporte por mes tenga datos en cualquier año.
function citasHistoricas(medicoId, anio, mes) {
  const semilla = (medicoId.charCodeAt(medicoId.length - 1) * 31 + anio * 7 + mes * 13) % 97;
  const base = medicoId === M1 ? 18 : 11;
  const estacional = [0, 2, 5, 3, 1, -2, -4, 1, 4, 6, 3, -5][mes];
  const total = Math.max(0, base + estacional + (semilla % 7) - 3);
  const canceladas = semilla % 4;
  return { total, canceladas };
}
function reporteCitasPorMes(anio, incluirCanceladas, medicoId) {
  const actual = new Date().getFullYear();
  const mesActual = new Date().getMonth();
  const elegidos = medicos.filter((m) => !medicoId || m.id === medicoId);
  const series = elegidos.map((m) => {
    const porMes = Array.from({ length: 12 }, (_, mes) => {
      // Citas reales del mock en ese mes
      const reales = citas.filter((c) => c.medicoId === m.id && c.fecha.startsWith(`${anio}-${String(mes + 1).padStart(2, '0')}`))
        .filter((c) => incluirCanceladas || c.estado !== 'Cancelada').length;
      // Historial sintético solo para meses ya cerrados
      if (anio > actual || (anio === actual && mes >= mesActual)) return reales;
      const h = citasHistoricas(m.id, anio, mes);
      return reales + h.total + (incluirCanceladas ? h.canceladas : 0);
    });
    return { medicoId: m.id, nombreMedico: m.nombre, especialidad: m.especialidad, citasPorMes: porMes, total: porMes.reduce((a, b) => a + b, 0) };
  });
  const totalesPorMes = Array.from({ length: 12 }, (_, i) => series.reduce((s, x) => s + x.citasPorMes[i], 0));
  return { anio, incluyeCanceladas: incluirCanceladas, medicos: series, totalesPorMes, total: totalesPorMes.reduce((a, b) => a + b, 0) };
}
function payload(req) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); } catch { return null; }
}
function franjas(medicoId, fecha) {
  const c = config.find((x) => x.medicoId === medicoId); if (!c) return [];
  const d = new Date(fecha + 'T12:00:00Z');
  if (fecha < dia(0) || !c.diasAtencion.includes(d.getUTCDay())) return [];
  const limite = dia(c.semanasHabilitadas * 7); if (fecha > limite) return [];
  const out = []; const [hi, mi] = c.horaInicio.split(':').map(Number); const [hf, mf] = c.horaFin.split(':').map(Number);
  for (let t = hi * 60 + mi; t + c.intervaloMinutos <= hf * 60 + mf; t += c.intervaloMinutos) {
    const hora = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`;
    const fin = `${String(Math.floor((t + c.intervaloMinutos) / 60)).padStart(2, '0')}:${String((t + c.intervaloMinutos) % 60).padStart(2, '0')}:00`;
    const ocupada = citas.some((x) => x.medicoId === medicoId && x.fecha.startsWith(fecha) && x.horaInicio === hora && x.estado !== 'Cancelada');
    const pseudo = (d.getUTCDate() * 7 + t) % 5 === 0; // algunas ocupadas "por otros"
    if (!ocupada && !pseudo) out.push({ fecha, horaInicio: hora, horaFin: fin });
  }
  return out;
}
const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 204);
  const { pathname, query } = url.parse(req.url, true);
  const p = payload(req);
  const roles = p?.realm_access?.roles || [];
  if (!p) return send(res, 401, { title: 'No autenticado' });
  const tiene = (...r) => r.some((x) => roles.includes(x));
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    if (pathname === '/api/medicos') return send(res, 200, medicos);
    if (pathname === '/api/citas' && req.method === 'GET') {
      if (!tiene('Agendador', 'Administrador', 'Medico', 'Terapista')) return send(res, 403, { detail: 'Prohibido' });
      return send(res, 200, citas.filter((c) => c.medicoId === query.medicoId && c.fecha.startsWith(query.fecha)));
    }
    const cancelar = pathname.match(/^\/api\/citas\/([^/]+)\/cancelar$/);
    if (cancelar && req.method === 'PUT') {
      if (!tiene('Paciente', 'Agendador', 'Administrador')) return send(res, 403, { detail: 'Prohibido' });
      const c = citas.find((x) => x.id === cancelar[1]);
      if (!c) return send(res, 404);
      if (c.estado === 'Cancelada' || c.estado === 'Atendida') return send(res, 409, { detail: 'No se puede cancelar una cita cancelada o atendida.' });
      const motivo = String((body ? JSON.parse(body) : {}).motivo || '').trim();
      //solo el paciente tiene justificación obligatoria y plazo de 48 h
      if (tiene('Paciente')) {
        if (c.pacienteDocumento !== p.documento) return send(res, 403, { detail: 'Solo puedes cancelar tus propias citas.' });
        if (!motivo) return send(res, 409, { detail: 'Debes indicar la justificación de la cancelación.' });
        if (motivo.length > 500) return send(res, 409, { detail: 'La justificación no puede superar 500 caracteres.' });
        const [y, m, d] = c.fecha.substring(0, 10).split('-').map(Number);
        const [h, mi] = c.horaInicio.split(':').map(Number);
        const horas = (Date.UTC(y, m - 1, d, h, mi) - (Date.now() - 5 * 3600 * 1000)) / 3600000; // hora de Colombia
        if (horas < 48) return send(res, 409, { detail: 'Solo puedes cancelar una cita con al menos 2 días (48 horas) de anticipación.' });
      }
      c.estado = 'Cancelada'; c.motivoCancelacion = motivo || null;
      return send(res, 204);
    }
    if (pathname === '/api/citas/franjas-disponibles') return send(res, 200, franjas(query.medicoId, query.fecha));
    if (pathname === '/api/citas/mis-citas') return send(res, 200, citas.filter((c) => c.pacienteDocumento === p.documento));
    if (pathname === '/api/citas/agendar') {
      const r = JSON.parse(body); const pac = pacientes.find((x) => x.documentoIdentidad === p.documento);
      const c = cita(r.medicoId, r.fecha, r.horaInicio.substring(0, 5), pac.id); citas.push(c); return send(res, 200, c);
    }
    if (pathname === '/api/citas/historial') {
      if (!tiene('Agendador', 'Administrador', 'Medico', 'Terapista')) return send(res, 403, { detail: 'Prohibido' });
      if (!pacientes.some((x) => x.documentoIdentidad === query.documento)) return send(res, 404, { detail: 'No existe' });
      return send(res, 200, citas.filter((c) => c.pacienteDocumento === query.documento));
    }
    if (pathname === '/api/pacientes/buscar') {
      return send(res, 200, pacientes.filter((x) => x.documentoIdentidad.startsWith(query.documento || '')).slice(0, Number(query.limite || 8)));
    }
    if (pathname === '/api/reportes/citas-por-mes') {
      if (!tiene('Medico', 'Terapista', 'Administrador')) return send(res, 403, { detail: 'Prohibido' });
      const anio = Number(query.anio || new Date().getFullYear());
      if (!Number.isInteger(anio) || anio < 2000 || anio > new Date().getFullYear() + 1) return send(res, 400, { mensaje: 'El año no es válido.' });
      if (query.medicoId && !medicos.some((m) => m.id === query.medicoId)) return send(res, 404, { mensaje: 'No existe el médico o terapista seleccionado.' });
      return send(res, 200, reporteCitasPorMes(anio, query.incluirCanceladas === 'true', query.medicoId));
    }
    if (pathname === '/api/configuracion' && req.method === 'GET') return send(res, 200, config);
    if (pathname.startsWith('/api/configuracion/')) return send(res, 200, config.find((c) => c.medicoId === pathname.split('/').pop()));
    send(res, 404, { detail: 'Ruta no simulada: ' + pathname });
  });
}).listen(5039, () => console.log('mock api on 5039'));
