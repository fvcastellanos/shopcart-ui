import { useState } from "react";
import { Formik } from "formik";
import {
    Alert,
    Box,
    Button,
    Grid,
    IconButton,
    Typography,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useAuthStore } from "../../storage/AppState";
import { getErrorMessage } from "../../client/ApiClient";
import { loginSchema, registerSchema } from "../../validation/auth";
import FormikTextField from "../../components/FormikTextField";

interface LoginProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

interface AuthValues {
    email: string;
    password: string;
    nombre: string;
}

export default function Login({ darkMode, onToggleDarkMode }: LoginProps) {
    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);
    const [mode, setMode] = useState<"login" | "register">("login");

    return (
        <>
            <Box sx={{ position: "fixed", top: 8, right: 8 }}>
                <IconButton onClick={onToggleDarkMode}>
                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
            </Box>
            <Grid container spacing={1} rowSpacing={1} sx={{ marginTop: "0.5em" }}>
                <Grid size={4} />
                <Grid size={4}>
                    <Formik<AuthValues>
                        key={mode}
                        initialValues={{ email: "", password: "", nombre: "" }}
                        validationSchema={mode === "login" ? loginSchema : registerSchema}
                        onSubmit={async (values, { setSubmitting, setStatus }) => {
                            setStatus(undefined);
                            try {
                                if (mode === "login") {
                                    await login(values.email, values.password);
                                } else {
                                    await register(values.email, values.password, values.nombre || undefined);
                                }
                            } catch (err) {
                                setStatus(getErrorMessage(err));
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ handleSubmit, isSubmitting, status }) => (
                            <Box
                                component="form"
                                onSubmit={handleSubmit}
                                sx={{
                                    p: 3,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    marginTop: "4em",
                                }}
                            >
                                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                                </Typography>

                                {status ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {status}
                                    </Alert>
                                ) : null}

                                {mode === "register" ? (
                                    <FormikTextField name="nombre" fullWidth label="Nombre" margin="dense" />
                                ) : null}

                                <FormikTextField
                                    name="email"
                                    fullWidth
                                    type="email"
                                    label="Correo electrónico"
                                    margin="dense"
                                />
                                <FormikTextField
                                    name="password"
                                    fullWidth
                                    type="password"
                                    label="Contraseña"
                                    margin="dense"
                                />

                                <Box sx={{ mt: 2 }}>
                                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                                        {isSubmitting
                                            ? "Procesando…"
                                            : mode === "login"
                                              ? "Iniciar Sesión"
                                              : "Registrarse"}
                                    </Button>
                                    &nbsp;&nbsp;
                                    <Button
                                        variant="outlined"
                                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                                    >
                                        {mode === "login" ? "Registrarse" : "Ya tengo cuenta"}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Formik>
                </Grid>
            </Grid>
        </>
    );
}
