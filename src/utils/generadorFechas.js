const { collection, getDocs } = require("firebase/firestore");
const db = require("../services/firebaseService");

async function obtenerFechasDisponibles() {

  const citasRef = collection(db, "citas");
  const snapshot = await getDocs(citasRef);

  // Solo bloquean huecos las citas activas
  const citasOcupadas = snapshot.docs
    .map(doc => doc.data())
    .filter(cita => cita.estado !== "cancelada")
    .map(cita => `${cita.fecha}_${cita.hora}`);

  const disponibles = [];

  const hoy = new Date();
  const diasFuturos = 30;
  const horasTrabajo = ["09:00", "10:00", "11:00", "12:00", "13:00"];

  for (let i = 1; i <= diasFuturos; i++) {

    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);

    const diaSemana = fecha.getDay();

    
    if (diaSemana === 0 || diaSemana === 6) {
      continue;
    }

    const fechaISO = fecha.toISOString().split("T")[0];

    for (const hora of horasTrabajo) {

      const clave = `${fechaISO}_${hora}`;

      if (!citasOcupadas.includes(clave)) {
        disponibles.push({
          fecha: fechaISO,
          hora
        });
      }
    }

    
    if (disponibles.length >= 3) {
      break;
    }
  }

  return disponibles.slice(0, 3);
}

module.exports = obtenerFechasDisponibles;