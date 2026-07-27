const { Router } = require("express");
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const configController = require("../controllers/configController");

const router = Router();

router.get("/", auth, rol("admin"), configController.obtenerConfig);
router.put("/", auth, rol("admin"), configController.actualizarConfig);
router.post("/respaldar", auth, rol("admin"), configController.respaldarBD);

module.exports = router;
