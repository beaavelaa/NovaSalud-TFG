const express = require("express");
const router = express.Router();
const {collection,getDocs,query,where} = require("firebase/firestore");

const db = require("../services/firebaseService");


router.use((req, res, next) => {

  if (!req.session.usuario) {
    return res.redirect("/auth/login");
  }

  if (req.session.usuario.rol !== "paciente") {
    return res.redirect("/");
  }

  next();
});




router.get("/", async (req, res) => {

  try {

    const citasRef = collection(db, "citas");

    const q = query(
        citasRef,
        where("pacienteId", "==", req.session.usuario.pacienteId)
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

    res.render("pacienteDashboard", {
      titulo: "Mis citas",
      citas
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando citas");
  }
});




router.get("/historial", async (req, res) => {

  try {

    const citasRef = collection(db, "citas");

    const q = query(
        citasRef,
        where("pacienteId", "==", req.session.usuario.pacienteId)
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

    res.render("pacienteHistorial", {
      titulo: "Historial de citas",
      citas
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando historial");
  }
});


module.exports = router;