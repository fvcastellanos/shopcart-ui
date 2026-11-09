import { useState } from "react";
import { Formik } from "formik";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiClient, getErrorMessage } from "../../client/ApiClient";
import { useFetch } from "../../hooks/useFetch";
import { SimpleTable, type Column } from "../../components/SimpleTable";
import { formatMoney, formatNumber } from "../../client/format";
import type { CategoriaDto, Paginated, ProductoDto } from "../../client/model/ApiModel";
import { isStaff } from "../../client/roles";
import { useAuthStore } from "../../storage/AppState";
import { productoSchema } from "../../validation/producto";
import FormikTextField from "../../components/FormikTextField";

export default function ProductosTab() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [busqueda, setBusqueda] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductoDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data: categorias } = useFetch<CategoriaDto[]>(() => apiClient.get("/categorias"), []);
    const { data, loading, error, reload } = useFetch<Paginated<ProductoDto>>(
        () => apiClient.get("/productos", { busqueda, tamanoPagina: 100 }),
        [busqueda]
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (p: ProductoDto) => {
        setEditing(p);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (p: ProductoDto) => {
        if (!window.confirm(`¿Desactivar el producto "${p.nombre}"?`)) return;
        try {
            await apiClient.delete(`/productos/${p.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<ProductoDto>[] = [
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "categoria", label: "Categoría" },
        {
            key: "precio",
            label: "Precio",
            align: "right",
            render: (p) =>
                p.precioDesde === p.precioHasta
                    ? formatMoney(p.precioDesde)
                    : `${formatMoney(p.precioDesde)} – ${formatMoney(p.precioHasta)}`,
        },
        { key: "existenciaTotal", label: "Existencia", align: "right", render: (p) => formatNumber(p.existenciaTotal) },
        { key: "activo", label: "Estado", render: (p) => (p.activo ? "Activo" : "Inactivo") },
        {
            key: "acciones",
            label: "",
            render: (p) =>
                canManage ? (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openEdit(p)}>
                            Editar
                        </Button>
                        <Button size="small" color="error" onClick={() => remove(p)}>
                            Desactivar
                        </Button>
                    </Stack>
                ) : null,
        },
    ];

    const initialValues = editing
        ? { nombre: editing.nombre, descripcion: editing.descripcion ?? "", idCategoria: String(editing.idCategoria) }
        : { nombre: "", descripcion: "", idCategoria: "" };

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
                {canManage ? (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Nuevo producto
                    </Button>
                ) : null}
                <TextField
                    size="small"
                    label="Buscar"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    sx={{ width: 300 }}
                />
            </Stack>

            <SimpleTable
                rows={data?.items ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(p) => p.id}
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <Formik
                    key={formKey}
                    initialValues={initialValues}
                    validationSchema={productoSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            const body = {
                                nombre: values.nombre,
                                descripcion: values.descripcion || undefined,
                                idCategoria: Number(values.idCategoria),
                            };
                            if (editing) {
                                await apiClient.put(`/productos/${editing.id}`, body);
                            } else {
                                await apiClient.post("/productos", body);
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
                            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
                            <DialogContent>
                                {status ? <Typography color="error">{status}</Typography> : null}
                                <FormikTextField name="nombre" fullWidth label="Nombre" margin="dense" />
                                <FormikTextField name="descripcion" fullWidth multiline label="Descripción" margin="dense" />
                                <FormikTextField name="idCategoria" select fullWidth label="Categoría" margin="dense">
                                    {(categorias ?? []).map((c) => (
                                        <MenuItem key={c.id} value={String(c.id)}>
                                            {c.nombre}
                                        </MenuItem>
                                    ))}
                                </FormikTextField>
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
