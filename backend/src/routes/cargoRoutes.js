const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const cargoController = require("../controllers/cargoController");

// Obtener todos los cargos
router.get("/", auth, cargoController.obtenerTodos);

// Obtener un cargo por id
router.get("/:id", auth, cargoController.obtenerPorId);

// Crear un cargo
router.post("/", auth, rol("admin"), cargoController.crear);

// Actualizar un cargo
router.put("/:id", auth, rol("admin"), cargoController.actualizar);

// Eliminar un cargo
router.delete("/:id", auth, rol("admin"), cargoController.eliminar);

module.exports = router;