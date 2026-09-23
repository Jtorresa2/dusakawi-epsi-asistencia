import { apiFetch } from "../../shared/api/api";

// The legacy backend answers paginated `{ total, page, limit, totalPages, items }`
// and each area arrives as `{ id, name, description, floor: { id, name } }`.
// Normalize to the frontend canonical `{ id, nombre, descripcion, piso }` array here
// so every consumer can rely on `.map`/`.filter`/`.sort` with `nombre`.
export const obtenerAreas = () =>
  apiFetch("/areas?limit=1000").then((res) => {
    const lista = Array.isArray(res) ? res : res?.items || res?.areas || [];
    return lista.map((a) => ({
      id: a.id,
      nombre: a.nombre || a.name,
      descripcion: a.descripcion || a.description || "",
      piso:
        typeof a.piso === "number"
          ? a.piso
          : Number(String(a.floor?.name || a.piso || "").replace(/\D/g, "")) || null,
    }));
  });

export const obtenerArea = (id) => apiFetch(`/areas/${id}`);

export const crearArea = (data) =>
  apiFetch("/areas", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarArea = (id, data) =>
  apiFetch(`/areas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarArea = (id) =>
  apiFetch(`/areas/${id}`, {
    method: "DELETE",
  });

export const obtenerEmpleadosPorArea = (id) => apiFetch(`/areas/${id}/empleados`);
