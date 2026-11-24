db = db.getSiblingDB("piedrazul_db");

// Limpieza completa para reiniciar la base de datos local
const collections = ["citas", "configuraciones_medico", "medicos", "pacientes"];
for (const collectionName of collections) {
  if (db.getCollectionNames().includes(collectionName)) {
    db.getCollection(collectionName).deleteMany({});
  }
}

// Médicos
const medicos = [
  { _id: ObjectId("650000000000000000000001"), Nombre: "Dra. Ana Restrepo", Especialidad: "Medicina General" },
  { _id: ObjectId("650000000000000000000002"), Nombre: "Dr. Julián Torres", Especialidad: "Terapia Física" },
  { _id: ObjectId("650000000000000000000003"), Nombre: "Dr. Mateo López", Especialidad: "Cardiología" }
];

// Configuraciones
const configuraciones = [
  {
    _id: ObjectId("660000000000000000000001"),
    MedicoId: "650000000000000000000001",
    DiasAtencion: [1, 2, 3, 4, 5],
    HoraInicio: "08:00:00",
    HoraFin: "12:00:00",
    IntervaloMinutos: 30,
    SemanasHabilitadas: 4,
    FechaActualizacion: new Date()
  },
  {
    _id: ObjectId("660000000000000000000002"),
    MedicoId: "650000000000000000000002",
    DiasAtencion: [1, 3, 5],
    HoraInicio: "14:00:00",
    HoraFin: "18:00:00",
    IntervaloMinutos: 20,
    SemanasHabilitadas: 6,
    FechaActualizacion: new Date()
  },
  {
    _id: ObjectId("660000000000000000000003"),
    MedicoId: "650000000000000000000003",
    DiasAtencion: [2, 4, 6],
    HoraInicio: "09:00:00",
    HoraFin: "13:00:00",
    IntervaloMinutos: 45,
    SemanasHabilitadas: 5,
    FechaActualizacion: new Date()
  }
];

// Usuarios con hash BCrypt válidos para las credenciales usadas en pruebas
const pacientes = [
  {
    _id: ObjectId("670000000000000000000001"),
    Nombre: "Carlos Pérez",
    DocumentoIdentidad: "1032456789",
    Telefono: "3001234567",
    Email: "paciente@example.com",
    PasswordHash: "$2b$12$/dFalxXx3T8mGg8USo331.D/1cEpMBWpJI7ONgdqWTSUWsI88WtkO",
    Rol: "Paciente",
    FechaRegistro: new Date()
  },
  {
    _id: ObjectId("670000000000000000000002"),
    Nombre: "Laura Gómez",
    DocumentoIdentidad: "2043123456",
    Telefono: "3017654321",
    Email: "laura@example.com",
    PasswordHash: "$2b$12$dHAnh0c1dA9BmdiyDMBOZuKDS3NUK5aSweiB2LVKTHWmPWj1jrYTO",
    Rol: "Paciente",
    FechaRegistro: new Date()
  }
];

const agendadores = [
  {
    _id: ObjectId("680000000000000000000001"),
    Nombre: "María Ruiz",
    DocumentoIdentidad: "987654321",
    Telefono: "3201112233",
    Email: "agendador@example.com",
    PasswordHash: "$2b$12$dHAnh0c1dA9BmdiyDMBOZuKDS3NUK5aSweiB2LVKTHWmPWj1jrYTO",
    Rol: "Agendador",
    FechaRegistro: new Date()
  }
];

const administradores = [
  {
    _id: ObjectId("690000000000000000000001"),
    Nombre: "Admin Sistema",
    DocumentoIdentidad: "123456789",
    Telefono: "3100001111",
    Email: "admin@example.com",
    PasswordHash: "$2b$12$jIAOirq3wFJxjhizj9.s0.fu8A9wsTKnnrSVmac2mMilPxrA7Vlw.",
    Rol: "Administrador",
    FechaRegistro: new Date()
  }
];

// Inserciones
if (medicos.length) db.medicos.insertMany(medicos);
if (configuraciones.length) db.configuraciones_medico.insertMany(configuraciones);
if (pacientes.length) db.pacientes.insertMany(pacientes);
if (agendadores.length) db.pacientes.insertMany(agendadores);
if (administradores.length) db.pacientes.insertMany(administradores);

// Citas de ejemplo
const fechaHoy = new Date();
const fechaMasTarde = new Date(fechaHoy);
fechaMasTarde.setDate(fechaHoy.getDate() + 2);

const citas = [
  {
    _id: ObjectId("710000000000000000000001"),
    MedicoId: "650000000000000000000001",
    Fecha: new Date(fechaMasTarde.getFullYear(), fechaMasTarde.getMonth(), fechaMasTarde.getDate(), 0, 0, 0, 0),
    HoraInicio: "09:00:00",
    HoraFin: "09:30:00",
    Estado: "Agendada",
    PacienteId: "670000000000000000000001",
    FechaCreacion: new Date()
  },
  {
    _id: ObjectId("710000000000000000000002"),
    MedicoId: "650000000000000000000002",
    Fecha: new Date(fechaMasTarde.getFullYear(), fechaMasTarde.getMonth(), fechaMasTarde.getDate(), 0, 0, 0, 0),
    HoraInicio: "15:00:00",
    HoraFin: "15:40:00",
    Estado: "Agendada",
    PacienteId: "670000000000000000000002",
    FechaCreacion: new Date()
  }
];

if (citas.length) db.citas.insertMany(citas);

// ---------------------------------------------------------------------------
// RF7: historial de citas para el reporte gráfico por mes y médico.
// Genera citas pasadas (año anterior y año actual hasta ayer) respetando los
// días y franjas configurados de cada profesional. Es determinista: siempre
// produce los mismos datos, así el reporte es reproducible en la sustentación.
// ---------------------------------------------------------------------------
const pacientesHistorial = [
  ["671000000000000000000001", "Juan Pérez Gómez", "1061000234"],
  ["671000000000000000000002", "María Fernanda López", "1061002345"],
  ["671000000000000000000003", "Andrés Ruiz Caicedo", "1062456789"],
  ["671000000000000000000004", "Carmen Muñoz", "10345678"],
  ["671000000000000000000005", "Óscar Hurtado", "1061009876"],
  ["671000000000000000000006", "Valentina Ortiz", "1061004567"],
  ["671000000000000000000007", "Sebastián Castro", "1061007788"],
  ["671000000000000000000008", "Daniela Rojas", "1061003399"]
].map(([id, nombre, documento]) => ({
  _id: ObjectId(id),
  Nombre: nombre,
  DocumentoIdentidad: documento,
  Telefono: "3000000000",
  Email: `${documento}@pacientes.piedrazul.test`,
  PasswordHash: "",
  Rol: "Paciente",
  FechaRegistro: new Date()
}));
db.pacientes.insertMany(pacientesHistorial);

let semilla = 20262;
const aleatorio = () => {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  return semilla / 2147483648;
};
const aHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}:00`;
// Más demanda en temporada escolar y fin de año; menos en vacaciones de mitad de año y diciembre.
const demandaMes = [0.75, 0.95, 1.1, 1.0, 0.9, 0.7, 0.6, 0.85, 1.05, 1.15, 1.0, 0.55];

const hoyUtc = new Date();
const inicioHoy = Date.UTC(hoyUtc.getUTCFullYear(), hoyUtc.getUTCMonth(), hoyUtc.getUTCDate());
const historial = [];
for (const anio of [hoyUtc.getUTCFullYear() - 1, hoyUtc.getUTCFullYear()]) {
  for (const cfg of configuraciones) {
    const [hi, mi] = cfg.HoraInicio.split(":").map(Number);
    const [hf, mf] = cfg.HoraFin.split(":").map(Number);
    const franjas = [];
    for (let t = hi * 60 + mi; t + cfg.IntervaloMinutos <= hf * 60 + mf; t += cfg.IntervaloMinutos) franjas.push(t);

    for (let dia = new Date(Date.UTC(anio, 0, 1)); dia.getTime() < inicioHoy && dia.getUTCFullYear() === anio; dia = new Date(dia.getTime() + 86400000)) {
      if (!cfg.DiasAtencion.includes(dia.getUTCDay())) continue;
      const cantidad = Math.round(aleatorio() * 3 * demandaMes[dia.getUTCMonth()]);
      const usadas = new Set();
      for (let i = 0; i < cantidad && usadas.size < franjas.length; i++) {
        let inicio = franjas[Math.floor(aleatorio() * franjas.length)];
        while (usadas.has(inicio)) inicio = franjas[(franjas.indexOf(inicio) + 1) % franjas.length];
        usadas.add(inicio);
        const paciente = pacientesHistorial[Math.floor(aleatorio() * pacientesHistorial.length)];
        historial.push({
          MedicoId: cfg.MedicoId,
          Fecha: new Date(dia.getTime()),
          HoraInicio: aHora(inicio),
          HoraFin: aHora(inicio + cfg.IntervaloMinutos),
          Estado: aleatorio() < 0.12 ? "Cancelada" : "Atendida",
          PacienteId: paciente._id.toString(),
          FechaCreacion: new Date(dia.getTime() - 3 * 86400000)
        });
      }
    }
  }
}
if (historial.length) db.citas.insertMany(historial);
print(`Historial para el reporte RF7: ${historial.length} citas pasadas.`);

print("Base de datos reiniciada y sembrada con usuarios de prueba.");
print("Credenciales:");
print("paciente@example.com / Paciente123");
print("agendador@example.com / Agendador123");
print("admin@example.com / Admin123");
