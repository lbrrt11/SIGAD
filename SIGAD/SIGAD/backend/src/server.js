// src/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// Importação das rotas
const authRoutes = require("./routes/authRoutes"); 
const documentRoutes = require("./routes/documentRoutes"); 
const funcionarioRoutes = require("./routes/funcionarioRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/documentos", documentRoutes);
app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/logs", require("./routes/logRoutes"));

app.get("/", (req, res) => {
    res.send("SGAD API funcionando!");
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});