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
import type { CategoriaDto } from "../../client/model/ApiModel";
import { isStaff } from "../../client/roles";
import { useAuthStore } from "../../storage/AppState";
import { categoriaSchema } from "../../validation/categoria";
import FormikTextField from "../../components/FormikTextField";

export default function CategoriasTab() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CategoriaDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data, loading, error, reload } = useFetch<CategoriaDto[]>(
        () => apiClient.get("/categorias"),
        []
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (c: CategoriaDto) => {
        setEditing(c);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (c: CategoriaDto) => {
        if (!window.confirm(`¿Desactivar la categoría "${c.nombre}"?`)) return;
        try {
            await apiClient.delete(`/categorias/${c.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<CategoriaDto>[] = [
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "activo", label: "Estado", render: (c) => (c.activo ? "Activa" : "Inactiva") },
        {
            key: "acciones",
            label: "",
            render: (c) =>
                canManage ? (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openEdit(c)}>
                            Editar
                        </Button>
                        <Button size="small" color="error" onClick={() => remove(c)}>
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
                    Nueva categoría
                </Button>
            ) : null}

            <SimpleTable rows={data ?? []} columns={columns} loading={loading} error={error} rowKey={(c) => c.id} />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <Formik
                    key={formKey}
                    initialValues={{ nombre: editing?.nombre ?? "" }}
                    validationSchema={categoriaSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            if (editing) {
                                await apiClient.put(`/categorias/${editing.id}`, values);
                            } else {
                                await apiClient.post("/categorias", values);
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
                            <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
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
