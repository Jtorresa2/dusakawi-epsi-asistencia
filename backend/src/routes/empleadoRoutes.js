const { Router } = require("express");
const router = Router();
const empleadoController = require("../controllers/empleadoController");
const uploadFoto = require("../middlewares/uploadFoto");

router.get("/", empleadoController.obtenerTodos);
router.get("/:id", empleadoController.obtenerPorId);
router.post("/", empleadoController.crear);
router.put("/:id", empleadoController.actualizar);
router.delete("/:id", empleadoController.eliminar);
router.post("/:id/foto", uploadFoto.single("foto"), empleadoController.subirFoto);

module.exports = router;
