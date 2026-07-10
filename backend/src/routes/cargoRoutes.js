const express = require("express");
const router = express.Router();

const cargoController = require("../controllers/cargoController");

// Obtener todos los cargos
router.get("/", cargoController.obtenerTodos);

// Obtener un cargo por id
router.get("/:id", cargoController.obtenerPorId);

// Crear un cargo
router.post("/", cargoController.crear);

// Actualizar un cargo
router.put("/:id", cargoController.actualizar);

// Eliminar un cargo
router.delete("/:id", cargoController.eliminar);

module.exports = router;