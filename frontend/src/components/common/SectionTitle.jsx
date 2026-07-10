import { Typography } from "@mui/material";

export default function SectionTitle({ children }) {
  return (
    <Typography
      variant="h6"
      fontWeight={600}
      mb={2}
      color="#1b5e20"
    >
      {children}
    </Typography>
  );
}