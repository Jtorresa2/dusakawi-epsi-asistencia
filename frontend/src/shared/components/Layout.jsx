import { useState, useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { COLORES } from "../constants/colores.js";

export default function Layout({ children }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    if (isMobile) setAbierto(false);
  }, [isMobile]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.nombre && u.nombre.toLowerCase().startsWith("administrador") && u.nombre !== "Administrador") {
          u.nombre = "Administrador";
          localStorage.setItem("usuario", JSON.stringify(u));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLORES.fondoGris2 }}>

      {/* Menú Lateral Sidebar */}
      <Sidebar abierto={abierto} setAbierto={setAbierto} isMobile={isMobile} />

      {/* Overlay oscuro para pantallas móviles */}
      <div
        onClick={() => setAbierto(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1299,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          opacity: isMobile && abierto ? 1 : 0,
          pointerEvents: isMobile && abierto ? "auto" : "none",
          transition: "opacity .3s ease",
        }}
      />

      {/* Contenedor Principal Header + Vistas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar abierto={abierto} setAbierto={setAbierto} isMobile={isMobile} />
        <main
          className="main-content-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? 16 : 24,
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}