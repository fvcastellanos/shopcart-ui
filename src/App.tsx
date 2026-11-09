import { useMemo, useState } from "react";
import "./App.css";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Navigate, Route, Routes } from "react-router";
import { useAuthStore } from "./storage/AppState";
import Login from "./views/auth/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./views/Dashboard";
import Catalogo from "./views/Catalogo";
import Inventario from "./views/Inventario";
import Carrito from "./views/Carrito";
import Pedidos from "./views/Pedidos";
import Cupones from "./views/Cupones";
import Direcciones from "./views/Direcciones";
import Bitacora from "./views/Bitacora";
import Home from "./views/Home";
import RequireRole from "./components/RequireRole";
import { ROL } from "./client/roles";

export default function App() {
    const [darkMode, setDarkMode] = useState(true);
    const authenticated = useAuthStore((state) => state.authenticated);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: darkMode ? "dark" : "light",
                    primary: {
                        main: "#1976d2",
                        light: "#4791db",
                        dark: "#115293",
                    },
                    secondary: {
                        main: "#f50057",
                    },
                    background: {
                        default: darkMode ? "#0e1217" : "#f8f9fa",
                        paper: darkMode ? "#181e26" : "#ffffff",
                    },
                },
                typography: {
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    h6: { fontWeight: 600 },
                    button: { textTransform: "none", fontWeight: 600 },
                },
                shape: {
                    borderRadius: 10,
                },
            }),
        [darkMode]
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {!authenticated ? (
                <Login darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />
            ) : (
                <Routes>
                    <Route element={<AppLayout darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />}>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/dashboard"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR]}>
                                    <Dashboard />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/catalogo"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR]}>
                                    <Catalogo />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/inventario"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR, ROL.OPERADOR]}>
                                    <Inventario />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/carrito"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR, ROL.CLIENTE]}>
                                    <Carrito />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/pedidos"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR, ROL.CLIENTE, ROL.OPERADOR]}>
                                    <Pedidos />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/cupones"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR]}>
                                    <Cupones />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/direcciones"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR, ROL.CLIENTE]}>
                                    <Direcciones />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="/bitacora"
                            element={
                                <RequireRole roles={[ROL.ADMINISTRADOR]}>
                                    <Bitacora />
                                </RequireRole>
                            }
                        />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </ThemeProvider>
    );
}

