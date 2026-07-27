import { Paper } from "@mui/material";

export default function AppCard({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        backgroundColor: "#fff",
        boxShadow: "0 4px 15px rgba(0,0,0,.04)",
      }}
    >
      {children}
    </Paper>
  );
}