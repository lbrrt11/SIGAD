// src/utils/logger.js
const db = require("../config/db");
const jwt = require("jsonwebtoken");

async function registrarLog(req, acao, detalhes) {
    try {
        let usuarioNome = "Sistema / Desconhecido";

        // 1. Tenta pegar o nome de quem está logado pelo Token
        if (req && req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            if (token && token !== "null" && token !== "undefined") {
                const decoded = jwt.decode(token); 
                if (decoded && decoded.login) {
                    usuarioNome = decoded.login; // Puxa exatamente o login do Admin que está logado
                }
            }
        } 
        
        // 2. EXCEÇÃO: Se a ação for LOGIN, pegamos o usuário do corpo da requisição
        // (pois na hora do login o token ainda não existe no navegador)
        if (acao === 'LOGIN' && req && req.body && req.body.login) {
            usuarioNome = req.body.login;
        }

        // 3. Salva a fofoca no banco de dados
        await db.query(
            "INSERT INTO log_atividades (usuario_nome, acao, detalhes) VALUES (?, ?, ?)", 
            [usuarioNome, acao, detalhes]
        );
    } catch (error) {
        console.error("Erro interno do fofoqueiro ao salvar log:", error);
    }
}

module.exports = registrarLog;