// src/config/db.js
const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sgad',
    port: process.env.DB_PORT, // 👈 Adicionado para puxar a porta customizada da Aiven
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // 👈 Adicionado para aceitar o certificado SSL exigido pela Aiven
    }
});

// Transforma o pool para aceitar async/await (Promises)
const db = pool.promise();

// Teste rápido de conexão ao iniciar o servidor
db.getConnection()
    .then(() => console.log("Banco de dados conectado com sucesso!"))
    .catch(err => console.error("Erro ao conectar no MySQL:", err.message));

module.exports = db;
