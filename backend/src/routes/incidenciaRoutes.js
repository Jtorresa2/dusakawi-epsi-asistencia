const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const upload = require("../middlewares/upload");
const uploadFirma = require("../middlewares/uploadFirma");
const incidenciaController = require("../controllers/incidenciaController");

router.post("/", auth, upload.single("evidencia"), incidenciaController.crear);
router.get("/", auth, incidenciaController.obtenerTodas);
router.get("/:id", auth, incidenciaController.obtenerPorId);
router.put("/:id/aprobar", auth, rol("admin", "talento_humano"), incidenciaController.aprobar);
router.put("/:id/aprobar-con-firma", auth, rol("admin", "talento_humano"), uploadFirma.single("archivo_firmado"), incidenciaController.aprobarConFirma);
router.put("/:id/rechazar", auth, rol("admin", "talento_humano"), incidenciaController.rechazar);
router.put("/:id/solicitar-correccion", auth, rol("admin", "talento_humano"), incidenciaController.solicitarCorreccion);
router.delete("/:id", auth, incidenciaController.eliminar);

module.exports = router;
