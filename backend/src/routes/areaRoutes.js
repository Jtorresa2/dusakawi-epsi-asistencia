const { Router } = require("express");
const router = Router();
const areaController = require("../controllers/areaController");

router.get("/", areaController.obtenerTodos);
router.get("/:id", areaController.obtenerPorId);
router.post("/", areaController.crear);
router.put("/:id", areaController.actualizar);
router.delete("/:id", areaController.eliminar);
router.get("/:id/empleados", areaController.obtenerEmpleadosPorArea);

module.exports = router;
