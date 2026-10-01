// src/controllers/logController.js
const db = require("../config/db");

exports.listarLogs = async (req, res) => {
    try {
        // Busca os últimos 100 logs do mais recente para o mais antigo
        const [rows] = await db.query("SELECT * FROM log_atividades ORDER BY data_hora DESC LIMIT 100");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao listar logs:", error);
        res.status(500).json({ message: "Erro interno ao buscar o log de atividades." });
    }
};