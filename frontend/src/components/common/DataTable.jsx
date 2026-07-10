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
  sx = {},
}) {
  return (
    <Box
      sx={{
        width: "100%",
        "& .MuiDataGrid-root": {
          border: "none",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#f5f5f5",
          fontWeight: 700,
        },
        "& .MuiDataGrid-columnHeaderTitle": {
          fontWeight: 700,
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: "#f8fff8",
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
        initialState={{
          pagination: {
            paginationModel: {
              pageSize,
            },
          },
        }}
      />
    </Box>
  );
}