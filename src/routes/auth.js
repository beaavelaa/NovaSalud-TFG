const express = require("express");
const router = express.Router();
const db = require("../services/firebaseService");
const {collection,query,where,getDocs,doc,updateDoc,addDoc} = require("firebase/firestore");

// Login
router.get("/login", (req, res) => {
  res.render("login", { layout: false, error: null });
});

router.post("/login", async (req, res) => {
  const { email, password, dni } = req.body;

  try {

    
    if (dni) {

      const pacientesRef = collection(db, "pacientes");
      const qPaciente = query(pacientesRef, where("DNI", "==", dni));
      const pacienteSnap = await getDocs(qPaciente);

      if (pacienteSnap.empty) {
        return res.render("login", { layout: false, error: "DNI no encontrado" });
      }

      const pacienteDoc = pacienteSnap.docs[0];
      const paciente = pacienteDoc.data();

      if (paciente.activo === false) {
        return res.render("login", { layout: false, error: "Paciente inactivo" });
      }

      
      const usuariosRef = collection(db, "usuarios");
      const qUser = query(usuariosRef, where("email", "==", paciente.Email));
      const userSnap = await getDocs(qUser);

      if (userSnap.empty) {
        return res.render("login", { layout: false, error: "Debes crear contraseña primero" });
      }

      const userDoc = userSnap.docs[0];
      const usuario = userDoc.data();

      if (usuario.contraseña !== password) {
        return res.render("login", { layout: false, error: "Contraseña incorrecta" });
      }

      req.session.usuario = {
        id: userDoc.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: "paciente",
        pacienteId: pacienteDoc.id
      };

      return res.redirect("/paciente");
    }

    
    const ref = collection(db, "usuarios");
    const q = query(ref, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.render("login", { layout: false, error: "Usuario no registrado" });
    }

    const docSnap = snapshot.docs[0];
    const usuario = docSnap.data();

    if (usuario.contraseña !== password) {
      return res.render("login", { layout: false, error: "Contraseña incorrecta" });
    }

    if (usuario.activo === false) {
      return res.render("login", { layout: false, error: "Usuario desactivado" });
    }

    req.session.usuario = {
      id: docSnap.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    
    if (usuario.primerLogin) {
      return res.redirect("/auth/cambiar-password");
    }

    if (usuario.rol === "admin") return res.redirect("/admin");
    if (usuario.rol === "medico") return res.redirect("/");
    if (usuario.rol === "paciente") return res.redirect("/paciente");

    return res.redirect("/");

  } catch (err) {
    console.error(err);
    return res.render("login", { layout: false, error: "Error interno" });
  }
});


router.get("/registro-paciente", (req, res) => {
  res.render("registroPaciente", { error: null });
});

router.post("/registro-paciente", async (req, res) => {
  const { dni, password } = req.body;
  
  if (password.length < 6) {

    return res.render("registroPaciente", {
      error: "La contraseña debe tener al menos 6 caracteres"
    });

  }

  try {
    const pacientesRef = collection(db, "pacientes");
    const q = query(pacientesRef, where("DNI", "==", dni));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.render("registroPaciente", { error: "Paciente no encontrado" });
    }

    const pacienteDoc = snapshot.docs[0];
    const paciente = pacienteDoc.data();

    if (paciente.activo === false) {
      return res.render("registroPaciente", { error: "Paciente inactivo" });
    }

    if (paciente.passwordCreada) {
      return res.render("registroPaciente", { error: "Ya tienes cuenta, inicia sesión" });
    }

    
    await addDoc(collection(db, "usuarios"), {
      nombre: paciente.Nombre,
      email: paciente.Email,
      contraseña: password,
      rol: "paciente",
      activo: true,
      primerLogin: false
    });

    
    await updateDoc(doc(db, "pacientes", pacienteDoc.id), {
      passwordCreada: true
    });

    return res.redirect("/auth/login");

  } catch (err) {
    console.error(err);
    res.render("registroPaciente", { error: "Error en registro" });
  }
});



router.get("/cambiar-password", (req, res) => {
  if (!req.session.usuario) {
    return res.redirect("/auth/login");
  }

  res.render("cambiarPassword", { error: null });
});

router.post("/cambiar-password", async (req, res) => {
  const { password } = req.body;
  if (password.length < 6) {

    return res.render("cambiarPassword", {
      error: "La contraseña debe tener al menos 6 caracteres"
    });

  }

  try {
    const userId = req.session.usuario.id;

    const ref = doc(db, "usuarios", userId);

    await updateDoc(ref, {
      contraseña: password,
      primerLogin: false
    });

    if (req.session.usuario.rol === "admin") return res.redirect("/admin");
    if (req.session.usuario.rol === "medico") return res.redirect("/");
    if (req.session.usuario.rol === "paciente") return res.redirect("/paciente");

    return res.redirect("/");

  } catch (err) {
    console.error(err);
    res.render("cambiarPassword", { error: "Error al actualizar contraseña" });
  }
});



router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

module.exports = router;