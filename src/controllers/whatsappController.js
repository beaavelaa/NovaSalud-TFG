const db = require("../services/firebaseService");
const { doc, getDoc } = require("firebase/firestore");
const twilio = require("twilio");
const formatDate = require("../utils/formatDate");


exports.enviarRecordatorioAutomatico = async (cita, paciente) => {

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const fechaFormateada = formatDate(cita.fecha);

  try {
    await client.messages.create({
      from: "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER,
      to: "whatsapp:" + paciente["Teléfono"],
      body: `Hola ${paciente.Nombre},
Tienes una cita el día ${fechaFormateada} a las ${cita.hora}.


Responde:
CONFIRMO 
NO CONFIRMO 
REPROGRAMAR `});

    console.log("Recordatorio enviado automáticamente");

  } catch (error) {
    console.error("❌ Error enviando WhatsApp:", error);
  }
};




exports.reenviarRecordatorio = async (req, res) => {
  const { id } = req.params;

  try {
    const citaRef = doc(db, "citas", id);
    const citaSnap = await getDoc(citaRef);

    if (!citaSnap.exists()) {
      return res.redirect("/citas?error=whatsapp");
    }

    const cita = { id: citaSnap.id, ...citaSnap.data() };

    const pacienteRef = doc(db, "pacientes", cita.pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);

    if (!pacienteSnap.exists()) {
      return res.redirect("/citas?error=whatsapp");
    }

    const paciente = pacienteSnap.data();

    await exports.enviarRecordatorioAutomatico(cita, paciente);

    res.redirect("/citas?success=whatsapp");

  } catch (error) {
    console.error(error);
    res.redirect("/citas?error=whatsapp");
  }
};