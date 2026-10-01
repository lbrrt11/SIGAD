const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");

// Suas rotas que já existem...
router.get("/servicos", documentController.listarServicos);
router.get("/modelos", documentController.listarModelos);
router.post("/modelos/cadastrar", documentController.cadastrarModelo);
router.get("/servicos/:servicoId/modelos", documentController.listarModelosPorServico);

// ✅ ADICIONE ESTA LINHA PARA LIBERAR A EXCLUSÃO:
router.delete("/modelos/:id", documentController.excluirModelo);

module.exports = router;

