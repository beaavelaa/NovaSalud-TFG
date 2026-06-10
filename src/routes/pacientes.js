const express = require("express");
const router = express.Router();
const pacientesController = require("../controllers/pacientesController");
const {collection,getDocs,query,where} = require("firebase/firestore");
const db = require("../services/firebaseService");




router.use((req, res, next) => {

  const rol = req.session.usuario?.rol;

  if (rol !== "medico" && rol !== "admin") {
    return res.redirect("/");
  }

  next();
});




router.get("/", async (req, res) => {

  try {

    const pacientes = await pacientesController.obtenerPacientes(true);

    res.render("pacientes", {
      titulo: "Pacientes activos",
      pacientes
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error obteniendo pacientes");
  }
});





router.get("/:id", async (req, res) => {

  try {

    const paciente = await pacientesController.obtenerPacientePorId(
      req.params.id
    );

    if (!paciente) {
      return res.status(404).send("Paciente no encontrado");
    }

  
    const citasRef = collection(db, "citas");

    const q = query(
      citasRef,
      where("pacienteId", "==", req.params.id)
    );

    const snapshot = await getDocs(q);

    const citas = snapshot.docs
      .map(d => ({
        id: d.id,
        ...d.data()
      }))
      .sort((a, b) =>
        b.fecha.localeCompare(a.fecha)
      );

    res.render("fichaPaciente", {
      titulo: `Ficha de ${paciente.Nombre}`,
      paciente,
      citas
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando ficha");
  }
});




router.post("/eliminar/:id", async (req, res) => {

  if (req.session.usuario.rol !== "admin") {
    return res.redirect("/pacientes");
  }

  try {

    await pacientesController.eliminarPaciente(
      req.params.id
    );

    res.redirect("/pacientes");

  } catch (error) {
    console.error(error);
    res.status(500).send("Error eliminando paciente");
  }
});



router.post("/reactivar/:id", async (req, res) => {

  if (req.session.usuario.rol !== "admin") {
    return res.redirect("/pacientes");
  }

  try {

    await pacientesController.reactivarPaciente(
      req.params.id
    );

    res.redirect("/pacientes/inactivos");

  } catch (error) {
    console.error(error);
    res.status(500).send("Error reactivando paciente");
  }
});


module.exports = router;