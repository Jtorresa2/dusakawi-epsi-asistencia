import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

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

export default function Layout({ children }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    if (isMobile) setAbierto(false);
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f4f7f6" }}>
      <Sidebar abierto={abierto} setAbierto={setAbierto} isMobile={isMobile} />
      {isMobile && abierto && (
        <div onClick={() => setAbierto(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1299, background: "rgba(0,0,0,0.3)" }} />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar abierto={abierto} setAbierto={setAbierto} isMobile={isMobile} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
