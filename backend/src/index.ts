import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./api/features/auth/authRoutes";
import areaRoutes from "./api/features/areas/areaRoutes";
import asistenciaRoutes from "./api/features/asistencia/asistenciaRoutes";
import usuariosRoutes from "./api/features/usuarios/usuariosRoutes";
import dashboardRoutes from "./api/features/dashboard/dashboardRoutes";
import cargoRoutes from "./api/features/cargos/cargoRoutes";
import empleadoRoutes from "./api/features/empleados/empleadoRoutes";
import incidenciaRoutes from "./api/features/incidencias/incidenciaRoutes";
import horarioRoutes from "./api/features/horarios/horarioRoutes";
import reportesRoutes from "./api/features/reportes/reportesRoutes";
import pdfRoutes from "./api/features/pdf/pdfRoutes";
import configRoutes from "./api/features/configuracion/configRoutes";
import novedadesRoutes from "./api/features/novedades/novedadesRoutes";
import festivosRoutes from "./api/features/festivos/festivosRoutes";
import marcacionRoutes from "./api/features/marcacion/marcacionRoutes";
import seguimientoRoutes from "./api/features/seguimiento/seguimientoRoutes";
import { iniciarAusentesJob } from "./jobs/ausentesJob";
import { configurarSwagger } from "./api/shared/docs/swagger";

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

// Swagger UI
configurarSwagger(app);

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