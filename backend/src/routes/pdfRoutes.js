// src/routes/pdfRoutes.js
const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdfController");

router.post("/gerar", pdfController.gerarDocumento);

module.exports = router;