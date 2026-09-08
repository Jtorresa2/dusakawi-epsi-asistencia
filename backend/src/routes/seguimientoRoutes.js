const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const { obtener } = require("../controllers/seguimientoController");

// Módulo de SOLO CONSULTA (REQ-13/14): restringido a admin y talento_humano.
router.get("/", auth, rol("admin", "talento_humano"), obtener);

module.exports = router;
