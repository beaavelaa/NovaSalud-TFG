const db = require("../services/firebaseService");
const { enviarRecordatorioAutomatico } = require("./whatsappController");
const {collection,getDocs,addDoc,doc,getDoc,updateDoc,query,where} = require("firebase/firestore");


exports.obtenerPacientes = async () => {

  const pacientesRef = collection(db, "pacientes");

  const snapshot = await getDocs(pacientesRef);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
};



exports.crearCita = async (data) => {

  const { pacienteId, fecha } = data;

  const pacienteRef = doc(db, "pacientes", pacienteId);

  const pacienteSnap = await getDoc(pacienteRef);

  if (!pacienteSnap.exists()) {
    throw new Error("El paciente no existe.");
  }

  const paciente = pacienteSnap.data();

  
  data.telefono = paciente["Teléfono"];

  if (paciente.activo === false) {
    throw new Error("No se puede crear una cita para un paciente inactivo.");
  }

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  const fechaCita = new Date(fecha);

  if (fechaCita < hoy) {
    throw new Error("No se pueden crear citas con fecha pasada.");
  }

  const citaPendiente =
    await exports.buscarCitaPendiente(pacienteId);

  if (citaPendiente) {
    throw new Error("El paciente ya tiene una cita pendiente.");
  }

  data.recordatorioEnviado = false;


  const nuevaCitaRef = await addDoc(
    collection(db, "citas"),
    data
  );

  const citaId = nuevaCitaRef.id;

  const nuevaCita = {
    id: citaId,
    ...data
  };


  await enviarRecordatorioAutomatico(
    nuevaCita,
    paciente
  );


  await updateDoc(doc(db, "citas", citaId), {
    recordatorioEnviado: true
  });

  return nuevaCitaRef;
};


exports.actualizarCita = async (
  citaId,
  nuevosDatos
) => {

  const citaRef = doc(db, "citas", citaId);

  await updateDoc(citaRef, nuevosDatos);
};



exports.buscarCitaPendiente = async (
  pacienteId
) => {

  const citasRef = collection(db, "citas");

  const q = query(
    citasRef,
    where("pacienteId", "==", pacienteId),
    where("estado", "==", "pendiente")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
};




exports.obtenerCitas = async () => {

  const citasRef = collection(db, "citas");

  const snapshot = await getDocs(citasRef);

  let citas = [];

  for (const citaDoc of snapshot.docs) {

    const data = citaDoc.data();

    const pacienteRef =
      doc(db, "pacientes", data.pacienteId);

    const pacienteSnap =
      await getDoc(pacienteRef);

    let paciente = {
      Nombre: "Desconocido",
      Teléfono: "N/A"
    };

    if (pacienteSnap.exists()) {
      paciente = pacienteSnap.data();
    }

    citas.push({
      id: citaDoc.id,
      ...data,
      pacienteNombre: paciente.Nombre,
      pacienteTelefono: paciente["Teléfono"]
    });
  }

  const total = citas.length;

  const confirmadas =
    citas.filter(c => c.estado === "confirmada").length;

  const pendientes =
    citas.filter(c => c.estado === "pendiente").length;

  const reprogramadas =
    citas.filter(c => c.estado === "reprogramada").length;

  const canceladas =
    citas.filter(c => c.estado === "cancelada").length;

  const tasaConfirmacion =
    total > 0
      ? ((confirmadas / total) * 100).toFixed(1)
      : 0;

  const tasaCancelacion =
    total > 0
      ? ((canceladas / total) * 100).toFixed(1)
      : 0;

  const tasaReprogramacion =
    total > 0
      ? ((reprogramadas / total) * 100).toFixed(1)
      : 0;

  const tasaAutomatizacion =
    total > 0
      ? (((confirmadas + reprogramadas) / total) * 100).toFixed(1)
      : 0;

  return {

    citas,

    metricas: {
      total,
      confirmadas,
      pendientes,
      reprogramadas,
      canceladas,
      tasaConfirmacion,
      tasaCancelacion,
      tasaReprogramacion,
      tasaAutomatizacion
    }
  };
};



exports.getDashboard = async (req, res) => {

  try {

    const citasRef = collection(db, "citas");

    const snapshot = await getDocs(citasRef);

    const hoyStr =
      new Date().toISOString().split("T")[0];

    let todasLasCitas = [];

    for (const citaDoc of snapshot.docs) {

      const data = citaDoc.data();

      const pacienteRef =
        doc(db, "pacientes", data.pacienteId);

      const pacienteSnap =
        await getDoc(pacienteRef);

      let pacienteNombre = "Desconocido";

      if (pacienteSnap.exists()) {
        pacienteNombre =
          pacienteSnap.data().Nombre || "Desconocido";
      }

      todasLasCitas.push({
        id: citaDoc.id,
        ...data,
        pacienteNombre
      });
    }

    const citasHoy =
      todasLasCitas.filter(c => c.fecha === hoyStr).length;

    const pendientes =
      todasLasCitas.filter(c => c.estado === "pendiente").length;

    const canceladas =
      todasLasCitas.filter(c => c.estado === "cancelada").length;

    const pacientesAtendidos =
      todasLasCitas.filter(c => c.estado === "confirmada").length;

    const proximasCitas = todasLasCitas
      .filter(c =>
        c.fecha >= hoyStr &&
        c.estado !== "cancelada"
      )
      .sort((a, b) =>
        `${a.fecha} ${a.hora || "00:00"}`
          .localeCompare(`${b.fecha} ${b.hora || "00:00"}`)
      )
      .slice(0, 5);

    const ayerStr = (() => {

      const d = new Date();

      d.setDate(d.getDate() - 1);

      return d.toISOString().split("T")[0];

    })();

    const alertas = {

      citasPendientesConfirmar: pendientes,

      noAcudieronAyer:
        todasLasCitas.filter(c =>
          c.fecha === ayerStr &&
          c.estado === "pendiente"
        ).length,

      recordatoriosPendientes:
        todasLasCitas.filter(c =>
          c.estado === "pendiente" &&
          !c.recordatorioEnviado
        ).length
    };

    const diasSemana =
      ["Lun", "Mar", "Mié", "Jue", "Vie"];

    const semana = Array.from(
      { length: 7 },
      (_, i) => {

        const d = new Date();

        d.setDate(d.getDate() + i);

        const dStr =
          d.toISOString().split("T")[0];

        return {
          label: diasSemana[d.getDay()],
          count:
            todasLasCitas.filter(c =>
              c.fecha === dStr
            ).length
        };
      }
    );

    res.render("index", {

      titulo: "Dashboard Médico",

      kpis: {
        citasHoy,
        pendientes,
        canceladas,
        pacientesAtendidos
      },

      proximasCitas,

      alertas,

      semanaLabels:
        JSON.stringify(semana.map(s => s.label)),

      semanaData:
        JSON.stringify(semana.map(s => s.count))
    });

  } catch (error) {

    console.error(
      "Error en getDashboard:",
      error
    );

    res.status(500).send(
      "Error al cargar el dashboard"
    );
  }
};