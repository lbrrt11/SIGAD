const express = require("express");
const router = express.Router();
const funcionarioController = require("../controllers/funcionarioController");

router.get("/", funcionarioController.listar);
router.post("/", funcionarioController.cadastrar);
router.delete("/:id", funcionarioController.excluir);

module.exports = router;
