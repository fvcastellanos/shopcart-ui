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
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiClient, getErrorMessage } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { formatDateTime, formatMoney, formatNumber } from "../client/format";
import type { CuponDto, CuponRequest, Paginated } from "../client/model/ApiModel";
import { isStaff } from "../client/roles";
import { useAuthStore } from "../storage/AppState";
import { cuponSchema } from "../validation/cupon";
import FormikTextField from "../components/FormikTextField";

interface CuponValues {
    codigo: string;
    tipo: string;
    valor: string;
    montoMinimo: string;
    fechaInicio: string;
    fechaFin: string;
    limiteTotalUsos: string;
    limiteUsoPorCliente: string;
}

const emptyValues: CuponValues = {
    codigo: "",
    tipo: "FIJO",
    valor: "",
    montoMinimo: "0",
    fechaInicio: "",
    fechaFin: "",
    limiteTotalUsos: "",
    limiteUsoPorCliente: "",
};

function toRequest(values: CuponValues): CuponRequest {
    const toSeconds = (v: string) => (v ? `${v}:00` : "");
    return {
        codigo: values.codigo,
        tipo: values.tipo,
        valor: Number(values.valor),
        montoMinimo: Number(values.montoMinimo) || 0,
        fechaInicio: toSeconds(values.fechaInicio),
        fechaFin: toSeconds(values.fechaFin),
        limiteTotalUsos: values.limiteTotalUsos ? Number(values.limiteTotalUsos) : undefined,
        limiteUsoPorCliente: values.limiteUsoPorCliente ? Number(values.limiteUsoPorCliente) : undefined,
    };
}

export default function Cupones() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [busqueda, setBusqueda] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CuponDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data, loading, error, reload } = useFetch<Paginated<CuponDto>>(
        () => apiClient.get("/cupones", { busqueda, tamanoPagina: 100 }),
        [busqueda]
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (c: CuponDto) => {
        setEditing(c);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (c: CuponDto) => {
        if (!window.confirm(`¿Desactivar el cupón "${c.codigo}"?`)) return;
        try {
            await apiClient.delete(`/cupones/${c.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<CuponDto>[] = [
        { key: "codigo", label: "Código" },
        { key: "tipo", label: "Tipo" },
        { key: "valor", label: "Valor", align: "right", render: (c) => formatMoney(c.valor) },
        { key: "montoMinimo", label: "Monto mín.", align: "right", render: (c) => formatMoney(c.montoMinimo) },
        { key: "totalUsos", label: "Usos", align: "right", render: (c) => formatNumber(c.totalUsos) },
        { key: "fechaFin", label: "Vence", render: (c) => formatDateTime(c.fechaFin) },
        { key: "activo", label: "Estado", render: (c) => (c.activo ? "Activo" : "Inactivo") },
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

    const initialValues: CuponValues = editing
        ? {
              codigo: editing.codigo,
              tipo: editing.tipo,
              valor: String(editing.valor),
              montoMinimo: String(editing.montoMinimo),
              fechaInicio: editing.fechaInicio.slice(0, 16),
              fechaFin: editing.fechaFin.slice(0, 16),
              limiteTotalUsos: editing.limiteTotalUsos != null ? String(editing.limiteTotalUsos) : "",
              limiteUsoPorCliente: editing.limiteUsoPorCliente != null ? String(editing.limiteUsoPorCliente) : "",
          }
        : emptyValues;

    return (
        <Box>
            <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Cupones
                </Typography>
                {canManage ? (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Nuevo cupón
                    </Button>
                ) : null}
            </Stack>

            <TextField
                size="small"
                label="Buscar por código"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                sx={{ mb: 2, width: 300 }}
            />

            <SimpleTable
                rows={data?.items ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(c) => c.id}
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <Formik<CuponValues>
                    key={formKey}
                    initialValues={initialValues}
                    validationSchema={cuponSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            if (editing) {
                                await apiClient.put(`/cupones/${editing.id}`, toRequest(values));
                            } else {
                                await apiClient.post("/cupones", toRequest(values));
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
                            <DialogTitle>{editing ? "Editar cupón" : "Nuevo cupón"}</DialogTitle>
                            <DialogContent>
                                {status ? <Typography color="error">{status}</Typography> : null}
                                <FormikTextField name="codigo" fullWidth label="Código" margin="dense" />
                                <FormikTextField name="tipo" fullWidth label="Tipo (FIJO / PORCENTAJE)" margin="dense" />
                                <FormikTextField name="valor" fullWidth type="number" label="Valor" margin="dense" />
                                <FormikTextField name="montoMinimo" fullWidth type="number" label="Monto mínimo" margin="dense" />
                                <FormikTextField
                                    name="fechaInicio"
                                    fullWidth
                                    type="datetime-local"
                                    label="Inicio"
                                    margin="dense"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <FormikTextField
                                    name="fechaFin"
                                    fullWidth
                                    type="datetime-local"
                                    label="Fin"
                                    margin="dense"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <FormikTextField name="limiteTotalUsos" fullWidth type="number" label="Límite total de usos" margin="dense" />
                                <FormikTextField name="limiteUsoPorCliente" fullWidth type="number" label="Límite por cliente" margin="dense" />
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
