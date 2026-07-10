const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// =======================
// Rutas
// =======================

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/asistencia", require("./routes/asistenciaRoutes"));
app.use("/api/usuarios", require("./routes/usuariosRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/cargos", require("./routes/cargoRoutes"));
app.use("/api/incidencias", require("./routes/incidenciaRoutes"));

// =======================

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Dusakawi EPSI activa",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});