// src/controllers/funcionarioController.js
const db = require("../config/db");
const registrarLog = require("../utils/logger"); 

exports.listar = async (req, res) => {
    try {
        // Adicionamos o nome_completo aqui na busca do banco
        const [rows] = await db.query("SELECT id, login, nome_completo, perfil FROM funcionario");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar funcionários" });
    }
};

exports.cadastrar = async (req, res) => {
    // Agora o back-end está preparado para receber o nome_completo do formulário
    const { login, nome_completo, senha, perfil } = req.body;

    // Trava de segurança atualizada para exigir o nome completo
    if (!login || !nome_completo || !senha) {
        return res.status(400).json({ message: "Preencha usuário, nome completo e senha." });
    }

    try {
        const [existe] = await db.query("SELECT id FROM funcionario WHERE login = ?", [login]);
        if (existe.length > 0) {
            return res.status(400).json({ message: "Este usuário já está cadastrado." });
        }

        // Deixei "Funcionario" sem acento para bater exato com o ENUM do seu banco de dados
        const perfilFinal = perfil || 'Funcionario';

        // Inserção no banco com a nova variável
        await db.query(
            "INSERT INTO funcionario (login, nome_completo, senha, perfil) VALUES (?, ?, ?, ?)", 
            [login, nome_completo, senha, perfilFinal]
        );
        
        // 📢 DISPARA O LOG AQUI
        await registrarLog(req, "CADASTRO_FUNCIONARIO", `Cadastrou o usuário: ${login} (${perfilFinal})`);

        res.status(201).json({ message: "Funcionário cadastrado com sucesso!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno ao cadastrar." });
    }
};

exports.excluir = async (req, res) => {
    const { id } = req.params;

    // 🛡️ TRAVA DO ADMIN MASTER: O usuário de ID 1 jamais poderá ser apagado!
    if (parseInt(id) === 1) {
        return res.status(403).json({ message: "O Admin master não pode ser excluído do sistema!" });
    }

    try {
        const [funcInfo] = await db.query("SELECT login FROM funcionario WHERE id = ?", [id]);
        let nomeDoExcluido = funcInfo.length > 0 ? funcInfo[0].login : "ID " + id;

        await db.query("DELETE FROM funcionario WHERE id = ?", [id]);
        
        // 📢 DISPARA O LOG AQUI
        await registrarLog(req, "EXCLUSAO_FUNCIONARIO", `Excluiu do sistema o usuário: ${nomeDoExcluido}`);

        res.json({ message: "Funcionário excluído." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao excluir." });
    }
};