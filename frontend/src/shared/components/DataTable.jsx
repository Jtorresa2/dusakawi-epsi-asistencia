import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

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
          backgroundColor: "#F9FAFB",
          borderBottom: "1px solid #ECECEC",
          minHeight: "48px!important",
          maxHeight: "48px!important",
        },
        "& .MuiDataGrid-columnHeader": {
          minHeight: "48px!important",
          maxHeight: "48px!important",
          height: "48px!important",
        },
        "& .MuiDataGrid-columnHeaderTitle": {
          fontWeight: 600,
          fontSize: 12,
          color: "#6B7280",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "1px solid #F3F4F6",
          py: 1.2,
          display: "flex",
          alignItems: "center",
          overflow: "visible",
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: "#F0FFF4",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "1px solid #ECECEC",
          minHeight: "56px",
        },
        "& .MuiTablePagination-root": {
          fontSize: 13,
          color: "#6B7280",
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
          color: "#6B7280",
          fontWeight: 500,
          margin: 0,
        },
        "& .MuiDataGrid-virtualScroller": {
          minHeight: 200,
        },
        ...sx,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight={autoHeight}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={onRowClick}
        getRowId={getRowId}
        getRowHeight={getRowHeight}
        localeText={{
          footerRowSelected: () => "",
          MuiTablePagination: {
            labelDisplayedRows: ({ from, to, count }) =>
              `Mostrando ${from}-${to} de ${count} ${entityLabel}`,
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
