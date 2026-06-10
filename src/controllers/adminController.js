const db = require("../services/firebaseService");
const { collection, getDocs, addDoc, updateDoc, doc, getDoc, query, where } = require("firebase/firestore");

const guardarLog = async (usuario, rol, accion, detalle) => {
  await addDoc(collection(db, "logs"), {
    usuario,
    rol,
    accion,
    detalle,
    fecha: new Date()
  });
};


exports.dashboard = async (req, res) => {

  const pacientesSnap = await getDocs(collection(db, "pacientes"));
  const citasSnap = await getDocs(collection(db, "citas"));
  const usuariosSnap = await getDocs(collection(db, "usuarios"));
  const logsSnap = await getDocs(collection(db, "logs"));

  const pacientes = pacientesSnap.size;
  const medicos = usuariosSnap.docs.filter(
    u => u.data().rol === "medico"
  ).length;
  const citas = citasSnap.size;

  const usuariosActivos = usuariosSnap.docs.filter(u => u.data().activo).length;

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const citasPorMes = Array(12).fill(0);

  citasSnap.forEach(doc => {
    const c = doc.data();
    if (c.fecha) {
      const fecha = new Date(c.fecha);
      citasPorMes[fecha.getMonth()]++;
    }
  });

  
  const logs = logsSnap.docs
    .map(d => d.data())
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  res.render("adminDashboard", {
    pacientes,
    medicos,
    citas,
    usuariosActivos,
    meses,
    citasPorMes,
    logs
  });
};



exports.usuarios = async (req, res) => {

  const snapshot = await getDocs(collection(db, "usuarios"));

  const usuarios = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  res.render("adminUsuarios", { usuarios });
};



exports.crearUsuario = async (req, res) => {

  const { nombre, email, password, rol, activo } = req.body;

  await addDoc(collection(db, "usuarios"), {
    nombre,
    email,
    contraseña: password,
    rol,
    activo: activo === "true"
  });

  await guardarLog(
    req.session.usuario.nombre,
    req.session.usuario.rol,
    "Creó usuario",
    `${nombre} (${rol})`
  );

  res.redirect("/admin/usuarios");
};




exports.toggleUsuario = async (req, res) => {

  const { id } = req.params;

  
  const usuarioRef = doc(db, "usuarios", id);
  const usuarioSnap = await getDoc(usuarioRef);

  const usuario = usuarioSnap.data();

  const nuevoEstado = !usuario.activo;

  
  await updateDoc(usuarioRef, {
    activo: nuevoEstado
  });

  
  const pacientesRef = collection(db, "pacientes");

  const q = query(
    pacientesRef,
    where("Email", "==", usuario.email)
  );

  const pacienteSnap = await getDocs(q);

  
  if (!pacienteSnap.empty) {

    const pacienteDoc = pacienteSnap.docs[0];

    await updateDoc(
      doc(db, "pacientes", pacienteDoc.id),
      {
        activo: nuevoEstado
      }
    );
  }

  
  await guardarLog(
    req.session.usuario.nombre,
    req.session.usuario.rol,
    usuario.activo
      ? "Desactivó usuario"
      : "Activó usuario",
    usuario.nombre
  );

  res.redirect("/admin/usuarios");
};




exports.editarUsuarioForm = async (req, res) => {

  const { id } = req.params;

  const ref = doc(db, "usuarios", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return res.redirect("/admin/usuarios");
  }

  const usuario = {
    id: snap.id,
    ...snap.data()
  };

  res.render("editarUsuario", { usuario });
};


exports.actualizarUsuario = async (req, res) => {

  const { id } = req.params;
  const { nombre, email, rol, activo } = req.body;

  const ref = doc(db, "usuarios", id);

  await updateDoc(ref, {
    nombre,
    email,
    rol,
    activo: activo === "true"
  });

  await guardarLog(
    req.session.usuario.nombre,
    req.session.usuario.rol,
    "Editó usuario",
    nombre
  );

  res.redirect("/admin/usuarios");
};



exports.crearPaciente = async (req, res) => {

  try {

    const {
      Nombre,
      DNI,
      Email,
      Teléfono,
      FechaNacimiento
    } = req.body;

     const validarDNI = (dni) => {

      const regex = /^[0-9]{8}[A-Za-z]$/;

      return regex.test(dni);

    };

    if (!validarDNI(DNI)) {
      return res.status(400).send("El DNI introducido no es válido");

    }

    const hoy = new Date();
    const fechaNacimiento = new Date(FechaNacimiento);

    if (fechaNacimiento > hoy) {
      return res.status(400).send("La fecha de nacimiento no puede ser futura");
    }

    
    
    await addDoc(collection(db, "pacientes"), {
      Nombre,
      DNI,
      Email,
      Teléfono,
      FechaNacimiento,
      activo: true,
      fechaCreacion: new Date()

    });


    
    
    
    await addDoc(collection(db, "usuarios"), {
      nombre: Nombre,
      email: Email,
      contraseña: DNI,
      rol: "paciente",
      activo: true,
      primerLogin: true

    });


    
    await guardarLog(
      req.session.usuario.nombre,
      req.session.usuario.rol,
      "Creó paciente",
      Nombre

    );

    res.redirect("/pacientes");

  } catch (error) {

    console.error(error);

    res.status(500).send("Error creando paciente");
  }
};