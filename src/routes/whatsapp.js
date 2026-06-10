const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");

router.post("/enviar/:id", whatsappController.reenviarRecordatorio);

module.exports = router;