import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { COLORES } from "../constants/colores.js";

export default function DataTable({
  rows = [],
  columns = [],
  loading = false,
  pageSize = 10,
  checkboxSelection = false,
  autoHeight = true,
  onRowClick,
  getRowId,
  getRowHeight,
  entityLabel = "registros",
  sx = {},
}) {
  return (
    <Box
      sx={{
        width: "100%",
        "& .MuiDataGrid-root": {
          border: "none",
          fontSize: 14,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: COLORES.fondoGris,
          borderBottom: `1px solid ${COLORES.grisContorno}`,
        },
        "& .MuiDataGrid-columnHeaderTitle": {
          fontWeight: 600,
          fontSize: 12,
          color: COLORES.textoTerciario,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: `1px solid ${COLORES.fondoGris2}`,
          py: 1.2,
          display: "flex",
          alignItems: "center",
        },
        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
          outline: "none!important",
        },
        "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
          outline: "none!important",
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: COLORES.successClaro || "rgba(16, 185, 129, 0.04)",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: `1px solid ${COLORES.grisContorno}`,
          minHeight: "56px",
        },
        "& .MuiTablePagination-root": {
          fontSize: 13,
          color: COLORES.textoTerciario,
        },
        "& .MuiTablePagination-spacer": {
          display: "none",
        },
        "& .MuiTablePagination-toolbar": {
          minHeight: 56,
          paddingLeft: 16,
        },
        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
          fontSize: 13,
          color: COLORES.textoTerciario,
          fontWeight: 500,
          margin: 0,
        },
        "& .MuiDataGrid-virtualScroller": {
          minHeight: 200,
        },
        "& .MuiDataGrid-scrollbar": {
          scrollbarWidth: "thin",
          scrollbarColor: `${COLORES.acento || "#10B981"} ${COLORES.primarioClaro || "#E6F4EA"}`,
        },
        "& .MuiDataGrid-scrollbar::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "& .MuiDataGrid-scrollbar::-webkit-scrollbar-track": {
          background: COLORES.primarioClaro || "#E6F4EA",
          borderRadius: 4,
        },
        "& .MuiDataGrid-scrollbar::-webkit-scrollbar-thumb": {
          background: COLORES.acento || "#10B981",
          borderRadius: 4,
        },
        ...sx,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight={autoHeight}
        columnHeaderHeight={48}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 15, 20, 50]}
        onRowClick={onRowClick}
        getRowId={getRowId}
        getRowHeight={getRowHeight}
        localeText={{
          noRowsLabel: "No hay registros para mostrar",
          footerRowSelected: () => "",
          MuiTablePagination: {
            labelDisplayedRows: ({ from, to, count }) =>
              `Mostrando ${from}-${to} de ${count !== -1 ? count : `más de ${to}`} ${entityLabel}`,
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize },
          },
        }}
        slotProps={{
          pagination: {
            labelRowsPerPage: "Filas por página",
          },
        }}
      />
    </Box>
  );
}