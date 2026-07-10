export default function CargosPage() {
  return <h1>Cargos</h1>;
}

// import { useEffect, useState } from "react";
// import {
//   Button,
//   Stack,
//   Typography,
// } from "@mui/material";

// import AddIcon from "@mui/icons-material/Add";

// import DataTable from "../../components/common/DataTable";
// import Loading from "../../components/common/Loading";
// import EmptyState from "../../components/common/EmptyState";

// import CargoModal from "./CargoModal";
// import { cargoColumns } from "./columns";

// import {
//   obtenerCargos,
//   crearCargo,
//   actualizarCargo,
//   eliminarCargo,
// } from "../../api/cargo.api";

// export default function CargosPage() {

//   const [cargos, setCargos] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [openModal, setOpenModal] = useState(false);

//   const [cargoSeleccionado, setCargoSeleccionado] = useState(null);

//   const [form, setForm] = useState({
//     nombre: "",
//     descripcion: "",
//   });

//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     cargarCargos();
//   }, []);

//   async function cargarCargos() {
//     try {
//       setLoading(true);

//       const data = await obtenerCargos();

//       setCargos(data);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function abrirNuevo() {
//     setCargoSeleccionado(null);

//     setForm({
//       nombre: "",
//       descripcion: "",
//     });

//     setErrors({});

//     setOpenModal(true);
//   }

//   function abrirEditar(cargo) {
//     setCargoSeleccionado(cargo);

//     setForm({
//       nombre: cargo.nombre,
//       descripcion: cargo.descripcion || "",
//     });

//     setErrors({});

//     setOpenModal(true);
//   }

//   function cerrarModal() {
//     setOpenModal(false);
//   }

//   function handleChange(e) {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   }

//   function validar() {

//     let nuevosErrores = {};

//     if (!form.nombre.trim()) {
//       nuevosErrores.nombre = "El nombre es obligatorio";
//     }

//     setErrors(nuevosErrores);

//     return Object.keys(nuevosErrores).length === 0;
//   }

//   async function guardarCargo() {

//     if (!validar()) return;

//     try {

//       if (cargoSeleccionado) {

//         await actualizarCargo(
//           cargoSeleccionado.id,
//           form
//         );

//       } else {

//         await crearCargo(form);

//       }

//       cerrarModal();

//       cargarCargos();

//     } catch (error) {

//       console.error(error);

//     }

//   }

//   async function abrirEliminar(cargo) {

//     const confirmar = window.confirm(
//       `¿Eliminar el cargo "${cargo.nombre}"?`
//     );

//     if (!confirmar) return;

//     try {

//       await eliminarCargo(cargo.id);

//       cargarCargos();

//     } catch (error) {

//       console.error(error);

//     }

//   }

//   if (loading) {
//     return <Loading />;
//   }

//   return (

//     <>

//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >

//         <Typography
//           variant="h4"
//           fontWeight={700}
//         >
//           Cargos
//         </Typography>

//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={abrirNuevo}
//         >
//           Nuevo Cargo
//         </Button>

//       </Stack>

//       {

//         cargos.length === 0 ?

//           <EmptyState
//             title="No hay cargos registrados"
//             description="Crea el primer cargo."
//           />

//           :

//           <DataTable
//             rows={cargos}
//             columns={
//               cargoColumns(
//                 abrirEditar,
//                 abrirEliminar
//               )
//             }
//             loading={loading}
//           />

//       }

//       <CargoModal
//         open={openModal}
//         onClose={cerrarModal}
//         onGuardar={guardarCargo}
//         cargo={cargoSeleccionado}
//         form={form}
//         errors={errors}
//         onChange={handleChange}
//       />

//     </>

//   );

// }