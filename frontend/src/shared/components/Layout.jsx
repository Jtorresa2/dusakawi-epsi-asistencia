import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { COLORES } from "../constants/colores.js";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

const mainScrollStyle = `
.main-content-scroll::-webkit-scrollbar { width: 6px; }
.main-content-scroll::-webkit-scrollbar-track { background: transparent; }
.main-content-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px; }
.main-content-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.25); }
.main-content-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.15) transparent; }
`;

export default function Layout({ children }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    if (isMobile) setAbierto(false);
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLORES.fondoGris2 }}>
      <style>{mainScrollStyle}</style>

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