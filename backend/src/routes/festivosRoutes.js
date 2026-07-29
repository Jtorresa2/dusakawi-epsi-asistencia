const { Router } = require("express");
const router = Router();
const festivosController = require("../controllers/festivosController");
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");

router.use(auth);

router.get("/", festivosController.obtenerTodos);
router.get("/verificar", festivosController.verificar);
router.post("/", rol("admin", "talento_humano"), festivosController.crear);
router.put("/:id", rol("admin", "talento_humano"), festivosController.actualizar);
router.delete("/:id", rol("admin", "talento_humano"), festivosController.eliminar);

module.exports = router;
