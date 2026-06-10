require("dotenv").config();

const express = require("express");
const path = require("path");
const twilio = require("twilio");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const {collection,query,where,getDocs} = require("firebase/firestore");

const db = require("./src/services/firebaseService");

const citasController = require("./src/controllers/citasController");
const obtenerFechasDisponibles = require("./src/utils/generadorFechas");

const pacientesRoutes = require("./src/routes/pacientes");
const pacienteRoutes = require("./src/routes/paciente");
const citasRoutes = require("./src/routes/citas");
const whatsappRoutes = require("./src/routes/whatsapp");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");


const auth = require("./src/middleware/auth");


const app = express();
const port = 3000;


app.use(
  session({
    secret: "clave-secreta",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");

app.set(
  "views",
  path.join(__dirname, "src/views")
);

app.use(expressLayouts);

app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));

app.use(express.json());


app.use((req, res, next) => {

  res.locals.session = req.session;

  next();
});


app.use("/auth", authRoutes);


app.post("/webhook-whatsapp", async (req, res) => {

  const mensajeOriginal = req.body.Body || "";

  const numeroCompleto = req.body.From || "";

  const mensaje =
    mensajeOriginal.trim().toLowerCase();

  const telefono =
    numeroCompleto.replace("whatsapp:", "");

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {

    const buscarCitaPendiente = async () => {

      const citasRef =
        collection(db, "citas");

      const q = query(
        citasRef,
        where("telefono", "==", telefono),
        where("estado", "==", "pendiente")
      );

      const snapshot =
        await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const citas = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .sort((a, b) =>
          `${a.fecha} ${a.hora}`
            .localeCompare(`${b.fecha} ${b.hora}`)
        );

      return citas[0];
    };



    if (mensaje === "confirmo") {

      const cita =
        await buscarCitaPendiente();

      if (!cita) {
        return res.send("No hay cita pendiente");
      }

      await citasController.actualizarCita(
        cita.id,
        {
          estado: "confirmada",
          fechaConfirmacion: new Date()
        }
      );

      await client.messages.create({

        from:
          "whatsapp:" +
          process.env.TWILIO_WHATSAPP_NUMBER,

        to: numeroCompleto,

        body:
          "Tu cita ha sido confirmada ✔️"
      });

      return res.send("OK");
    }



    if (mensaje === "no confirmo") {

      const cita =
        await buscarCitaPendiente();

      if (!cita) {
        return res.send("No hay cita pendiente");
      }

      await citasController.actualizarCita(
        cita.id,
        {
          estado: "cancelada"
        }
      );

      await client.messages.create({

        from:
          "whatsapp:" +
          process.env.TWILIO_WHATSAPP_NUMBER,

        to: numeroCompleto,

        body:
          "Tu cita ha sido cancelada ❌"
      });

      return res.send("OK");
    }




    if (mensaje === "reprogramar") {

      const cita =
        await buscarCitaPendiente();

      if (!cita) {
        return res.send("No hay cita pendiente");
      }

      const fechasDisponibles =
        await obtenerFechasDisponibles();

      if (fechasDisponibles.length === 0) {

        await client.messages.create({

          from:
            "whatsapp:" +
            process.env.TWILIO_WHATSAPP_NUMBER,

          to: numeroCompleto,

          body:
            "No hay fechas disponibles actualmente."
        });

        return res.send("OK");
      }

      let mensajeRespuesta =
        "Selecciona nueva fecha:\n\n";

      fechasDisponibles.forEach((f, i) => {

        mensajeRespuesta +=
          `${i + 1}️⃣ ${f.fecha} - ${f.hora}\n`;

      });

      mensajeRespuesta +=
        `\nResponde:\n` +
        `ELEGIR 1\n` +
        `ELEGIR 2\n` +
        `ELEGIR 3`;

      await client.messages.create({

        from:
          "whatsapp:" +
          process.env.TWILIO_WHATSAPP_NUMBER,

        to: numeroCompleto,

        body: mensajeRespuesta
      });

      return res.send("OK");
    }



    if (mensaje.startsWith("elegir")) {

      const partes =
        mensaje.split(" ");

      const opcion =
        parseInt(partes[1]) - 1;

      const cita =
        await buscarCitaPendiente();

      if (!cita) {
        return res.send("No hay cita pendiente");
      }

      const fechasDisponibles =
        await obtenerFechasDisponibles();

      const nuevaFecha =
        fechasDisponibles[opcion];

      if (!nuevaFecha) {
        return res.send("OK");
      }

      await citasController.actualizarCita(
        cita.id,
        {
          fecha: nuevaFecha.fecha,
          hora: nuevaFecha.hora,
          estado: "reprogramada",
          fechaReprogramacion: new Date()
        }
      );

      await client.messages.create({

        from:
          "whatsapp:" +
          process.env.TWILIO_WHATSAPP_NUMBER,

        to: numeroCompleto,

        body:
          `Tu cita ha sido reprogramada ` +
          `al ${nuevaFecha.fecha} ` +
          `a las ${nuevaFecha.hora} ✔️`
      });

      return res.send("OK");
    }



    await client.messages.create({

      from:
        "whatsapp:" +
        process.env.TWILIO_WHATSAPP_NUMBER,

      to: numeroCompleto,

      body:
        "Comando no reconocido.\n\n" +
        "Usa:\n" +
        "CONFIRMO\n" +
        "NO CONFIRMO\n" +
        "REPROGRAMAR"
    });

    res.send("OK");

  } catch (error) {

    console.error(error);

    res.send("Error");
  }
});



app.use(auth);

app.use("/admin", adminRoutes);

app.use("/pacientes", pacientesRoutes);

app.use("/paciente", pacienteRoutes);

app.use("/citas", citasRoutes);

app.use("/whatsapp", whatsappRoutes);



app.get("/", async (req, res) => {

  
  if (!req.session.usuario) {
    return res.redirect("/auth/login");
  }

  
  if (req.session.usuario.rol === "admin") {
    return res.redirect("/admin");
  }

  
  if (req.session.usuario.rol === "paciente") {
    return res.redirect("/paciente");
  }

  
  return citasController.getDashboard(req, res);
});


app.listen(port, () => {

  console.log(
    `Servidor escuchando en http://localhost:${port}`
  );

});