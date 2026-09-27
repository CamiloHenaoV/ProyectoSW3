// Seed inicial para pruebas del primer corte
db = db.getSiblingDB("piedrazul_db");

db.medicos.insertMany([
  { _id: ObjectId("650000000000000000000001"), Nombre: "Dra. Ana Restrepo", Especialidad: "Medicina General" },
  { _id: ObjectId("650000000000000000000002"), Nombre: "Dr. Julián Torres", Especialidad: "Terapia Física" }
]);

db.configuraciones_medico.insertMany([
  {
    MedicoId: "650000000000000000000001",
    DiasAtencion: [1, 2, 3, 4, 5],
    HoraInicio: "08:00:00",
    HoraFin: "12:00:00",
    IntervaloMinutos: 30,
    SemanasHabilitadas: 4,
    FechaActualizacion: new Date()
  },
  {
    MedicoId: "650000000000000000000002",
    DiasAtencion: [1, 3, 5],
    HoraInicio: "14:00:00",
    HoraFin: "18:00:00",
    IntervaloMinutos: 20,
    SemanasHabilitadas: 6,
    FechaActualizacion: new Date()
  }
]);
