const { Router } = require("express");
const router = Router();
const empleadoController = require("../controllers/empleadoController");

router.get("/", empleadoController.obtenerTodos);
router.get("/:id", empleadoController.obtenerPorId);
router.post("/", empleadoController.crear);
router.put("/:id", empleadoController.actualizar);
router.delete("/:id", empleadoController.eliminar);

module.exports = router;
