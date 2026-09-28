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

print("Base de datos reiniciada y sembrada con usuarios de prueba.");
print("Credenciales:");
print("paciente@example.com / Paciente123");
print("agendador@example.com / Agendador123");
print("admin@example.com / Admin123");
