import { createTheme } from "@mui/material/styles";
import { COLORES } from '../shared/constants/colores.js';

const theme = createTheme({

  palette: {

    primary: {

      main: COLORES.primario,

    },

    secondary: {

      main: COLORES.acento,

    },

    background: {

      default: COLORES.verdeVariante3,

    },

  },

  shape: {

    borderRadius: 12,

  },

  typography: {

    fontFamily: "Segoe UI",

  },

});

export default theme;