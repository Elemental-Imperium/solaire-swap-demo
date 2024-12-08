import { createTheme } from '@mui/material/styles';

const lightPalette = {
  mode: 'light',
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
  },
  secondary: {
    main: '#f48fb1',
    light: '#f8bbd0',
    dark: '#f06292',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
};

export const getTheme = (mode) => createTheme({
  palette: mode === 'dark' ? darkPalette : lightPalette,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
}); 