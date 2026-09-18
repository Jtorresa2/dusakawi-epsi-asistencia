import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./routes/authRoutes";
import areaRoutes from "./routes/areaRoutes";
import asistenciaRoutes from "./routes/asistenciaRoutes";
import usuariosRoutes from "./routes/usuariosRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import cargoRoutes from "./routes/cargoRoutes";
import empleadoRoutes from "./routes/empleadoRoutes";
import incidenciaRoutes from "./routes/incidenciaRoutes";
import horarioRoutes from "./routes/horarioRoutes";
import reportesRoutes from "./routes/reportesRoutes";
import pdfRoutes from "./routes/pdfRoutes";
import configRoutes from "./routes/configRoutes";
import novedadesRoutes from "./routes/novedadesRoutes";
import festivosRoutes from "./routes/festivosRoutes";
import marcacionRoutes from "./routes/marcacionRoutes";
import seguimientoRoutes from "./routes/seguimientoRoutes";
import { iniciarAusentesJob } from "./jobs/ausentesJob";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// =======================
// Rutas
// =======================

app.use("/api/auth", authRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/incidencias", incidenciaRoutes);
app.use("/api/horarios", horarioRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/config", configRoutes);
app.use("/api/novedades", novedadesRoutes);
app.use("/api/festivos", festivosRoutes);
app.use("/api/marcacion", marcacionRoutes);
app.use("/api/seguimiento", seguimientoRoutes);

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

// =======================
// Jobs programados
// =======================
iniciarAusentesJob();