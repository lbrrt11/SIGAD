// src/controllers/documentController.js
const db = require("../config/db");
const registrarLog = require("../utils/logger"); 

exports.listarServicos = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM servico");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao listar serviços:", error);
        res.status(500).json({ message: "Erro ao buscar serviços no banco." });
    }
};

exports.listarModelosPorServico = async (req, res) => {
    const { servicoId } = req.params; 

    try {
        // 🛠️ O ERRO ESTAVA AQUI: Agora estamos puxando a 'natureza_documento' do banco!
        const [rows] = await db.query(
            "SELECT id, nome_modelo, natureza_documento, descricao, texto_base FROM modelo WHERE servico_id = ?", 
            [servicoId]
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao listar modelos:", error);
        res.status(500).json({ message: "Erro ao buscar modelos no banco." });
    }
};

exports.cadastrarModelo = async (req, res) => {
    const { nome_modelo, tipo_documento, natureza_documento, texto_base } = req.body;

    if (!nome_modelo || !tipo_documento || !texto_base) {
        return res.status(400).json({ message: "Preencha o nome do modelo, o serviço e o texto base com as tags." });
    }

    const mapaServicos = {
        "Escritura": 1,
        "Procuração": 2,
        "Substabelecimento": 3,
        "Ata Notarial": 4,
        "Testamento": 5,
        "Certidão": 6
    };

    const servico_id = mapaServicos[tipo_documento];

    if (!servico_id) {
        return res.status(400).json({ message: "Tipo de serviço inválido." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO modelo (nome_modelo, servico_id, natureza_documento, texto_base) VALUES (?, ?, ?, ?)",
            [nome_modelo, servico_id, natureza_documento, texto_base]
        );

        await registrarLog(req, "CADASTRO_MODELO", `Cadastrou o modelo: ${nome_modelo}`);

        res.status(201).json({ 
            message: "Modelo criado e pronto para uso!", 
            id: result.insertId 
        });
    } catch (error) {
        console.error("Erro ao criar modelo:", error);
        res.status(500).json({ message: "Erro interno ao salvar o modelo no banco." });
    }
};

exports.listarModelos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                m.id, 
                m.nome_modelo, 
                s.nome AS tipo, 
                m.natureza_documento AS natureza, 
                m.texto_base 
            FROM modelo m
            INNER JOIN servico s ON m.servico_id = s.id
            ORDER BY m.id DESC
        `);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao listar todos os modelos:", error);
        res.status(500).json({ message: "Erro ao buscar modelos no banco." });
    }
};

exports.excluirModelo = async (req, res) => {
    const { id } = req.params;

    try {
        const [modeloInfo] = await db.query("SELECT nome_modelo FROM modelo WHERE id = ?", [id]);
        let nomeDoExcluido = modeloInfo.length > 0 ? modeloInfo[0].nome_modelo : "ID " + id;

        const [result] = await db.query("DELETE FROM modelo WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Modelo não encontrado no banco." });
        }

        await registrarLog(req, "EXCLUSAO_MODELO", `Excluiu permanentemente o modelo: ${nomeDoExcluido}`);

        res.status(200).json({ message: "Modelo excluído com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir modelo:", error);
        res.status(500).json({ message: "Erro interno ao excluir o modelo." });
    }
};