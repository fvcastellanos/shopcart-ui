import { useState } from "react";
import { Formik } from "formik";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiClient, getErrorMessage } from "../../client/ApiClient";
import { useFetch } from "../../hooks/useFetch";
import { SimpleTable, type Column } from "../../components/SimpleTable";
import type { AtributoDto } from "../../client/model/ApiModel";
import { isStaff } from "../../client/roles";
import { useAuthStore } from "../../storage/AppState";
import { atributoSchema } from "../../validation/atributo";
import FormikTextField from "../../components/FormikTextField";

export default function AtributosTab() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AtributoDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data, loading, error, reload } = useFetch<AtributoDto[]>(
        () => apiClient.get("/atributos"),
        []
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (a: AtributoDto) => {
        setEditing(a);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (a: AtributoDto) => {
        if (!window.confirm(`¿Desactivar el atributo "${a.nombre}"?`)) return;
        try {
            await apiClient.delete(`/atributos/${a.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<AtributoDto>[] = [
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "activo", label: "Estado", render: (a) => (a.activo ? "Activo" : "Inactivo") },
        {
            key: "acciones",
            label: "",
            render: (a) =>
                canManage ? (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openEdit(a)}>
                            Editar
                        </Button>
                        <Button size="small" color="error" onClick={() => remove(a)}>
                            Desactivar
                        </Button>
                    </Stack>
                ) : null,
        },
    ];

    return (
        <Box>
            {canManage ? (
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ mb: 2 }}>
                    Nuevo atributo
                </Button>
            ) : null}

            <SimpleTable rows={data ?? []} columns={columns} loading={loading} error={error} rowKey={(a) => a.id} />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <Formik
                    key={formKey}
                    initialValues={{ nombre: editing?.nombre ?? "" }}
                    validationSchema={atributoSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            if (editing) {
                                await apiClient.put(`/atributos/${editing.id}`, values);
                            } else {
                                await apiClient.post("/atributos", values);
                            }
                            setOpen(false);
                            reload();
                        } catch (err) {
                            setStatus(getErrorMessage(err));
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ handleSubmit, isSubmitting, status }) => (
                        <Box component="form" onSubmit={handleSubmit}>
                            <DialogTitle>{editing ? "Editar atributo" : "Nuevo atributo"}</DialogTitle>
                            <DialogContent>
                                {status ? <Typography color="error">{status}</Typography> : null}
                                <FormikTextField name="nombre" autoFocus fullWidth label="Nombre" margin="dense" />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting}>
                                    {isSubmitting ? "Guardando…" : "Guardar"}
                                </Button>
                            </DialogActions>
                        </Box>
                    )}
                </Formik>
            </Dialog>
        </Box>
    );
}
