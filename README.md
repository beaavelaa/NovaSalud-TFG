# NovaSalud

## Diseño e implementación de un sistema clínico digital multiusuario con comunicación automatizada y gestión asistencial en la nube

### Descripción del proyecto

NovaSalud es una plataforma web desarrollada como Trabajo Fin de Grado cuyo objetivo es mejorar la gestión clínica y la comunicación entre profesionales sanitarios y pacientes mediante la digitalización de los procesos asistenciales.

La aplicación permite la gestión integral de pacientes y citas médicas mediante una arquitectura basada en el patrón Modelo-Vista-Controlador (MVC) y una infraestructura de almacenamiento en la nube utilizando Firebase Firestore.

El sistema incorpora distintos perfiles de usuario (administrador, médico y paciente) con funcionalidades específicas para cada rol.

Como elemento diferenciador, NovaSalud integra la API de Twilio WhatsApp para automatizar el envío de recordatorios y permitir a los pacientes confirmar, cancelar o solicitar la reprogramación de sus citas mediante mensajería instantánea.

## Funcionalidades principales

- Gestión de usuarios con roles diferenciados.
- Registro y administración de pacientes.
- Creación y modificación de citas médicas.
- Historial de citas.
- Dashboard con métricas asistenciales.
- Envío automático de recordatorios mediante WhatsApp.
- Confirmación, cancelación y reprogramación de citas.
- Control de acceso mediante sesiones.
- Persistencia de datos en Firebase Firestore.

## Tecnologías utilizadas

| Componente              | Tecnología |
|------------------------|------------|
| Backend                | Node.js + Express |
| Motor de plantillas    | EJS + Express Layouts |
| Base de datos          | Firebase Firestore |
| Autenticación          | express-session |
| Mensajería             | Twilio WhatsApp API |
| Webhooks               | Express |
| Túnel seguro           | ngrok |
| Variables de entorno   | dotenv |
| Gestión de dependencias| npm |

- Para la integración con WhatsApp se utiliza Twilio en modo Sandbox.
- Para permitir la recepción de mensajes desde Twilio, es necesario abrir un túnel seguro mediante ngrok.
- Firebase Firestore se utiliza como base de datos en la nube.
- Las credenciales sensibles se gestionan mediante variables de entorno y no se incluyen en el repositorio.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/beaavelaa/NovaSalud-TFG.git
```

### 2. Acceder al directorio del proyecto

```bash
cd NovaSalud-TFG
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Configurar las variables de entorno

Crear un archivo `.env` con las credenciales necesarias para Firebase y Twilio.

Ejemplo:

```env
TWILIO_ACCOUNT_SID=xxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 5. Ejecutar la aplicación

```bash
node app.js
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

Las dependencias necesarias se instalan automáticamente mediante `npm install`, utilizando la configuración definida en `package.json`.


## Autor

**Beatriz Vela Moscoso**

Trabajo Fin de Grado

**Título del TFG:**
Diseño e implementación de un sistema clínico digital multiusuario con comunicación automatizada y gestión asistencial en la nube

**Grado:**
Ingeniería de la Salud

**Universidad:**
Universidad de Sevilla

**Curso académico:**
2025-2026


