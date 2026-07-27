const { Router } = require("express");
const router = Router();
const permisosController = require("../controllers/permisosController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/", permisosController.obtenerTodos);
router.post("/", permisosController.crear);

module.exports = router;
