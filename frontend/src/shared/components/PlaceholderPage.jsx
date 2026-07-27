import { Box, Typography } from "@mui/material";
import { Construction } from "lucide-react";
import IconBox from "./IconBox";

export default function PlaceholderPage({ title }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", p: 6, gap: 2 }}>
      <IconBox icon={<Construction />} color="#9CA3AF" size={80} iconSize={38} />
      <Typography variant="h5" fontWeight={700} color="#1B5E20">
        {title || "En construcción"}
      </Typography>
      <Typography color="#9CA3AF">
        Esta sección está en desarrollo.
      </Typography>
    </Box>
  );
}
