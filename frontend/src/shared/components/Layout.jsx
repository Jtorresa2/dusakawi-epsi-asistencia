import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [abierto, setAbierto] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f7f6",
      }}
    >
      <Sidebar abierto={abierto} setAbierto={setAbierto} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "all .3s ease",
        }}
      >
        <Navbar abierto={abierto} setAbierto={setAbierto} />

        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}