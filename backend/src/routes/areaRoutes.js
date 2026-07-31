const { Router } = require("express");
const router = Router();
const auth = require("../middlewares/authMiddleware");
const areaController = require("../controllers/areaController");

// All area routes require a valid Bearer token; the frontend (apiFetch)
// attaches the Authorization header on every call, so no route is exempt.
router.get("/", auth, areaController.obtenerTodos);
router.get("/:id", auth, areaController.obtenerPorId);
router.post("/", auth, areaController.crear);
router.put("/:id", auth, areaController.actualizar);
router.delete("/:id", auth, areaController.eliminar);
router.get("/:id/empleados", auth, areaController.obtenerEmpleadosPorArea);

module.exports = router;
