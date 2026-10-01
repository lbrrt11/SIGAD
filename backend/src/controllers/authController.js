// src/controllers/authController.js
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const registrarLog = require("../utils/logger");

exports.login = async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
        return res.status(400).json({ message: "Por favor, preencha usuário e senha." });
    }

    try {
        const [rows] = await db.query("SELECT * FROM funcionario WHERE login = ?", [login]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Usuário não encontrado." });
        }

        const usuario = rows[0];

        if (senha !== usuario.senha) {
            return res.status(401).json({ message: "Senha incorreta." });
        }

        const token = jwt.sign(
            { 
                id: usuario.id, 
                perfil: usuario.perfil, 
                login: usuario.login,
                nome_completo: usuario.nome_completo 
            },
            process.env.JWT_SECRET,
            { expiresIn: "12h" } 
        );

        await registrarLog(req, "LOGIN", "Usuário acessou o sistema SGAD.");

        res.status(200).json({
            message: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id,
                login: usuario.login,
                nome_completo: usuario.nome_completo,
                perfil: usuario.perfil
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};