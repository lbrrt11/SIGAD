// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Rota POST para efetuar o login
router.post("/login", authController.login);

module.exports = router;