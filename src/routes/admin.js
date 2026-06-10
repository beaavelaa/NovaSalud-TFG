const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");


router.use((req, res, next) => {

  if (!req.session.usuario) {
    return res.redirect("/auth/login");
  }

  
  if (req.session.usuario.rol !== "admin") {
    return res.redirect("/");
  }

  next();
});


router.get("/", adminController.dashboard);

router.get("/usuarios", adminController.usuarios);

router.get("/crear-usuario", (req, res) => {
  res.render("crearUsuario", {
    titulo: "Crear usuario"
  });
});

router.post("/crear-usuario", adminController.crearUsuario);


router.get("/crear-paciente", (req, res) => {
  res.render("crearPaciente", {
    titulo: "Crear paciente"
  });
});


router.post("/crear-paciente", adminController.crearPaciente);

router.get("/editar/:id", adminController.editarUsuarioForm);

router.post("/editar/:id", adminController.actualizarUsuario);

router.post("/toggle/:id", adminController.toggleUsuario);


module.exports = router;