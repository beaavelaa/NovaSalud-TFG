const express = require("express");
const router = express.Router();

const citasController = require("../controllers/citasController");
const pacientesController = require("../controllers/pacientesController");

const formatDate = require("../utils/formatDate");

const { doc, getDoc } = require("firebase/firestore");

const db = require("../services/firebaseService");


const soloMedico = (req, res, next) => {

  if (req.session.usuario.rol !== "medico") {
    return res.redirect("/");
  }

  next();
};



router.get("/nueva", soloMedico, async (req, res) => {

  try {

    const pacientes = await citasController.obtenerPacientes();

    let pacientePreseleccionado = null;

    if (req.query.pacienteId) {

      pacientePreseleccionado =
        await pacientesController.obtenerPacientePorId(
          req.query.pacienteId
        );
    }

    res.render("crearCita", {
      titulo: "Crear nueva cita",
      pacientes,
      pacientePreseleccionado
    });

  } catch (error) {

    console.error(error);
    res.status(500).send("Error cargando formulario");
  }
});


router.post("/nueva", soloMedico, async (req, res) => {

  try {

    const {pacienteId,fecha,hora,motivo,estado} = req.body;

    if (hora < "09:00" || hora > "13:00") {

      return res.redirect("/citas?error=Horario no permitido");
    }
    const fechaObj = new Date(fecha);

    const diaSemana = fechaObj.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
      return res.redirect("/citas?error=No se permiten citas en fin de semana");

    }

    const resultado = await citasController.obtenerCitas();

    const citaDuplicada = resultado.citas.find(c =>
      c.fecha === fecha &&
      c.hora === hora &&
      c.estado !== "cancelada"

    );

    if (citaDuplicada) {

      return res.redirect("/citas?error=Ese horario ya está ocupado");
    }


    await citasController.crearCita({
      pacienteId,
      fecha,
      hora,
      motivo,
      estado: estado || "pendiente",
      fechaCreacion: new Date()
    });

    res.redirect("/citas");

  } catch (error) {

    console.error(error);

    res.redirect(
      `/citas?error=${encodeURIComponent(error.message)}`
    );
  }
});



router.get("/", soloMedico, async (req, res) => {

  try {

    const resultado = await citasController.obtenerCitas();

    res.render("citas", {
      titulo: "Citas programadas",
      citas: resultado.citas,
      metricas: resultado.metricas,
      formatDate,
      success: req.query.success,
      errorMsg: req.query.error
    });

  } catch (error) {

    console.error(error);
    res.status(500).send("Error obteniendo citas");
  }
});



router.get("/:id", soloMedico, async (req, res) => {

  try {

    const citaRef = doc(db, "citas", req.params.id);

    const citaSnap = await getDoc(citaRef);

    if (!citaSnap.exists()) {
      return res.status(404).send("Cita no encontrada");
    }

    const cita = {
      id: citaSnap.id,
      ...citaSnap.data()
    };

    const paciente =
      await pacientesController.obtenerPacientePorId(
        cita.pacienteId
      );

    cita.pacienteNombre =
      paciente?.Nombre || "Desconocido";

    res.render("editarCita", {
      titulo: "Detalle de cita",
      cita,
      modoVer: true
    });

  } catch (error) {

    console.error(error);
    res.status(500).send("Error cargando cita");
  }
});




router.get("/:id/editar", soloMedico, async (req, res) => {

  try {

    const citaRef = doc(db, "citas", req.params.id);

    const citaSnap = await getDoc(citaRef);

    if (!citaSnap.exists()) {
      return res.status(404).send("Cita no encontrada");
    }

    const cita = {
      id: citaSnap.id,
      ...citaSnap.data()
    };

    if (cita.estado === "cancelada") {
      return res.redirect("/citas");
    }

    const paciente =
      await pacientesController.obtenerPacientePorId(
        cita.pacienteId
      );

    cita.pacienteNombre =
      paciente?.Nombre || "Desconocido";

    res.render("editarCita", {
      titulo: "Editar cita",
      cita,
      modoVer: false
    });

  } catch (error) {

    console.error(error);
    res.status(500).send("Error cargando formulario");
  }
});


router.post("/:id/editar", soloMedico, async (req, res) => {

  try {

    const {
      fecha,
      hora,
      estado,
      motivo
    } = req.body;

    await citasController.actualizarCita(
      req.params.id,
      {
        fecha,
        hora,
        estado,
        motivo,
        fechaModificacion: new Date()
      }
    );

    res.redirect("/citas?success=editada");

  } catch (error) {

    console.error(error);

    res.redirect(
      `/citas?error=${encodeURIComponent(error.message)}`
    );
  }
});


module.exports = router;