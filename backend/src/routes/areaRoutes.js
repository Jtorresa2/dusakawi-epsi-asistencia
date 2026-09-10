const { Router } = require("express");
const router = Router();
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const areaController = require("../controllers/areaController");

// Lectura: cualquier usuario autenticado
router.get("/", auth, areaController.obtenerTodos);
router.get("/:id", auth, areaController.obtenerPorId);
router.get("/:id/empleados", auth, areaController.obtenerEmpleadosPorArea);

// Escritura: solo admin y talento_humano
router.post("/", auth, rol("admin", "talento_humano"), areaController.crear);
router.put("/:id", auth, rol("admin", "talento_humano"), areaController.actualizar);
router.delete("/:id", auth, rol("admin", "talento_humano"), areaController.eliminar);

module.exports = router;
