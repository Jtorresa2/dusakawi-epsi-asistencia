import { apiFetch } from "../../shared/api/api";

const extractPiso = (area) => {
  if (typeof area.piso === "number") return area.piso;
  if (typeof area.floor === "object" && area.floor?.name) {
    const match = area.floor.name.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  if (typeof area.floor === "string") {
    const match = area.floor.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 1;
};

export const obtenerAreas = async () => {
  const data = await apiFetch("/areas?limit=1000");
  const list = Array.isArray(data) ? data : (data?.items || []);
  return list.map((a) => ({
    ...a,
    id: a.id,
    nombre: a.nombre || a.name || "",
    descripcion: a.descripcion || a.description || "",
    piso: extractPiso(a),
    floorId: a.floor?.id || a.floorId,
  }));
};

export const obtenerArea = async (id) => {
  const a = await apiFetch(`/areas/${id}`);
  return {
    ...a,
    id: a.id,
    nombre: a.nombre || a.name || "",
    descripcion: a.descripcion || a.description || "",
    piso: extractPiso(a),
    floorId: a.floor?.id || a.floorId,
  };
};

export const crearArea = async (data) => {
  let floorId = data.floorId;
  if (!floorId && data.piso) {
    try {
      const floors = await apiFetch("/floors");
      const fList = Array.isArray(floors) ? floors : (floors?.items || []);
      const match = fList.find((f) => f.name?.includes(String(data.piso)));
      if (match) floorId = match.id;
    } catch {}
  }
  return apiFetch("/areas", {
    method: "POST",
    body: JSON.stringify({
      name: data.nombre || data.name,
      description: data.descripcion || data.description || "",
      floorId: floorId || "91cd5370-1488-4c56-b562-374bef8c59d7",
    }),
  });
};

export const actualizarArea = async (id, data) => {
  let floorId = data.floorId;
  if (!floorId && data.piso) {
    try {
      const floors = await apiFetch("/floors");
      const fList = Array.isArray(floors) ? floors : (floors?.items || []);
      const match = fList.find((f) => f.name?.includes(String(data.piso)));
      if (match) floorId = match.id;
    } catch {}
  }
  return apiFetch(`/areas/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: data.nombre || data.name,
      description: data.descripcion || data.description || "",
      floorId: floorId || "91cd5370-1488-4c56-b562-374bef8c59d7",
    }),
  });
};

export const eliminarArea = (id) =>
  apiFetch(`/areas/${id}`, {
    method: "DELETE",
  });

export const obtenerEmpleadosPorArea = async (id) => {
  const res = await apiFetch(`/empleados?area=${id}`);
  return res.empleados || (Array.isArray(res) ? res : []);
};
