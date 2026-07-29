const { Router } = require("express");
const router = Router();
const novedadesController = require("../controllers/novedadesController");
const authMiddleware = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");

router.use(authMiddleware);

router.get("/", novedadesController.obtenerTodos);
router.post("/", rol("admin", "talento_humano"), novedadesController.crear);
router.put("/:id", rol("admin", "talento_humano"), novedadesController.actualizar);
router.delete("/:id", rol("admin", "talento_humano"), novedadesController.eliminar);

// Lectura para empleados (sus propias novedades)
router.get("/mios", novedadesController.mios);

module.exports = router;
