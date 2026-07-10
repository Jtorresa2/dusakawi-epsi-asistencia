const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const upload = require("../middlewares/upload");
const incidenciaController = require("../controllers/incidenciaController");

router.post("/", auth, upload.single("evidencia"), incidenciaController.crear);
router.get("/", auth, incidenciaController.obtenerTodas);
router.get("/:id", auth, incidenciaController.obtenerPorId);
router.put("/:id/aprobar", auth, rol("admin", "talento_humano"), incidenciaController.aprobar);
router.put("/:id/rechazar", auth, rol("admin", "talento_humano"), incidenciaController.rechazar);

module.exports = router;