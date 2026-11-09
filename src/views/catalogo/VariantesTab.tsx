import { useState } from "react";
import { Formik } from "formik";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
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
import type { Paginated, ProductoDto, VarianteDto } from "../../client/model/ApiModel";
import { isStaff } from "../../client/roles";
import { useAuthStore } from "../../storage/AppState";
import { varianteSchema, varianteUpdateSchema } from "../../validation/variante";
import FormikTextField from "../../components/FormikTextField";
import VarianteAtributosDialog from "./VarianteAtributosDialog";

export default function VariantesTab() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [productoId, setProductoId] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<VarianteDto | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [atributosVariante, setAtributosVariante] = useState<VarianteDto | null>(null);

    const { data: productos } = useFetch<Paginated<ProductoDto>>(
        () => apiClient.get("/productos", { tamanoPagina: 100 }),
        []
    );

    const { data: producto, loading, error, reload } = useFetch<ProductoDto | null>(
        () => (productoId ? apiClient.get<ProductoDto>(`/productos/${productoId}`) : Promise.resolve(null)),
        [productoId]
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (v: VarianteDto) => {
        setEditing(v);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (v: VarianteDto) => {
        if (!window.confirm(`¿Desactivar la variante "${v.sku}"?`)) return;
        try {
            await apiClient.delete(`/variantes/${v.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<VarianteDto>[] = [
        { key: "id", label: "ID" },
        { key: "sku", label: "SKU" },
        {
            key: "atributos",
            label: "Atributos",
            render: (v) =>
                (v.atributos?.length ?? 0) > 0
                    ? v.atributos!.map((a) => `${a.nombre}: ${a.valor}`).join(", ")
                    : "—",
        },
        { key: "precio", label: "Precio", align: "right", render: (v) => formatMoney(v.precio) },
        { key: "existencia", label: "Existencia", align: "right", render: (v) => formatNumber(v.existencia) },
        { key: "activo", label: "Estado", render: (v) => (v.activo ? "Activa" : "Inactiva") },
        {
            key: "acciones",
            label: "",
            render: (v) =>
                canManage ? (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openEdit(v)}>
                            Editar
                        </Button>
                        <Button size="small" onClick={() => setAtributosVariante(v)}>
                            Atributos
                        </Button>
                        <Button size="small" color="error" onClick={() => remove(v)}>
                            Desactivar
                        </Button>
                    </Stack>
                ) : null,
        },
    ];

    const initialValues = editing
        ? {
              sku: editing.sku,
              precio: String(editing.precio),
              existencia: String(editing.existencia),
              activo: editing.activo,
          }
        : { sku: "", precio: "", existencia: "", activo: true };

    const schema = editing ? varianteUpdateSchema : varianteSchema;

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
                <TextField
                    select
                    size="small"
                    label="Producto"
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    sx={{ minWidth: 300 }}
                >
                    {(productos?.items ?? []).map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                            {p.nombre}
                        </MenuItem>
                    ))}
                </TextField>
                {canManage && productoId ? (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Nueva variante
                    </Button>
                ) : null}
            </Stack>

            <SimpleTable
                rows={producto?.variantes ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(v) => v.id}
                emptyText="Selecciona un producto para ver sus variantes"
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <Formik
                    key={formKey}
                    initialValues={initialValues}
                    validationSchema={schema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            if (editing) {
                                await apiClient.put(`/variantes/${editing.id}`, {
                                    precio: Number(values.precio),
                                    existencia: Number(values.existencia),
                                    activo: values.activo,
                                });
                            } else {
                                await apiClient.post("/variantes", {
                                    idProducto: Number(productoId),
                                    sku: values.sku,
                                    precio: Number(values.precio),
                                    existencia: Number(values.existencia),
                                });
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
                    {({ handleSubmit, isSubmitting, status, values, handleChange }) => (
                        <Box component="form" onSubmit={handleSubmit}>
                            <DialogTitle>{editing ? "Editar variante" : "Nueva variante"}</DialogTitle>
                            <DialogContent>
                                {status ? <Typography color="error">{status}</Typography> : null}
                                {editing ? null : (
                                    <FormikTextField name="sku" fullWidth label="SKU" margin="dense" />
                                )}
                                <FormikTextField name="precio" fullWidth type="number" label="Precio" margin="dense" />
                                <FormikTextField name="existencia" fullWidth type="number" label="Existencia" margin="dense" />
                                {editing ? (
                                    <FormControlLabel
                                        control={
                                            <Checkbox name="activo" checked={values.activo} onChange={handleChange} />
                                        }
                                        label="Activa"
                                    />
                                ) : null}
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

            {atributosVariante ? (
                <VarianteAtributosDialog
                    variante={atributosVariante}
                    onClose={() => setAtributosVariante(null)}
                    onChanged={reload}
                />
            ) : null}
        </Box>
    );
}
