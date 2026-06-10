const db = require("../services/firebaseService");
const {collection,getDocs,doc,getDoc,addDoc,updateDoc} = require("firebase/firestore");


exports.obtenerPacientes = async (soloActivos = true) => {

  const pacientesRef = collection(db, "pacientes");
  const snapshot = await getDocs(pacientesRef);

  let pacientes = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));

  
  if (soloActivos) {
    pacientes = pacientes.filter(p => p.activo === true);
  }

  return pacientes;
};



exports.obtenerPacientePorId = async (id) => {

  const pacienteRef = doc(db, "pacientes", id);
  const pacienteSnap = await getDoc(pacienteRef);

  if (!pacienteSnap.exists()) {
    return null;
  }

  return {
    id: pacienteSnap.id,
    ...pacienteSnap.data()
  };
};



exports.crearPaciente = async (data) => {

  return await addDoc(collection(db, "pacientes"), {
    ...data,
    activo: true,
    passwordCreada: false,
    fechaCreacion: new Date()
  });
};



exports.eliminarPaciente = async (id) => {

  const pacienteRef = doc(db, "pacientes", id);

  await updateDoc(pacienteRef, {
    activo: false,
    fechaDesactivacion: new Date()
  });
};



exports.reactivarPaciente = async (id) => {

  const pacienteRef = doc(db, "pacientes", id);

  await updateDoc(pacienteRef, {
    activo: true,
    fechaReactivacion: new Date()
  });
};