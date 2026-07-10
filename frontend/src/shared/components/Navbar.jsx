import { Menu, Bell, Search } from "lucide-react";

export default function Navbar({ abierto, setAbierto }) {
  return (
    <header
      style={{
        height: 70,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        padding: "0 24px",

        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* IZQUIERDA */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => setAbierto(!abierto)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <Menu size={22} />
        </button>

        <h2
          style={{
            margin: 0,
            fontSize: 22,
            color: "#374151",
          }}
        >
          Dashboard
        </h2>
      </div>

      {/* CENTRO */}

      <div
        style={{
          width: 380,
          position: "relative",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 14,
            top: 11,
            color: "#9ca3af",
          }}
        />

        <input
          placeholder="Buscar..."
          style={{
            width: "100%",

            padding: "10px 16px 10px 42px",

            borderRadius: 12,

            border: "1px solid #d1d5db",

            outline: "none",

            fontSize: 14,
          }}
        />
      </div>

      {/* DERECHA */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Bell
          size={20}
          color="#4b5563"
          style={{ cursor: "pointer" }}
        />

        <img
          src="/logo.png"
          alt="usuario"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
          }}
        />
      </div>
    </header>
  );
}