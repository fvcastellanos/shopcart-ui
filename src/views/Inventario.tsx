import { useState, type FormEvent } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { apiClient, getErrorMessage } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { formatDateTime, formatNumber } from "../client/format";
import type { ExistenciaDto, KardexDto, Paginated, ProductoDto } from "../client/model/ApiModel";
import { isStaff } from "../client/roles";
import { useAuthStore } from "../storage/AppState";

export default function Inventario() {
    const rol = useAuthStore((state) => state.user?.rol);
    const canManage = isStaff(rol);

    const [productoId, setProductoId] = useState("");
    const [varianteId, setVarianteId] = useState("");

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"entrada" | "ajuste">("entrada");
    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("");
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const { data: productos } = useFetch<Paginated<ProductoDto>>(
        () => apiClient.get("/productos", { tamanoPagina: 100 }),
        []
    );

    const { data: producto } = useFetch<ProductoDto | null>(
        () => (productoId ? apiClient.get<ProductoDto>(`/productos/${productoId}`) : Promise.resolve(null)),
        [productoId]
    );

    const existencias = useFetch<ExistenciaDto | null>(
        () => (varianteId ? apiClient.get(`/inventario/${varianteId}/existencias`) : Promise.resolve(null)),
        [varianteId]
    );

    const kardex = useFetch<Paginated<KardexDto>>(
        () =>
            varianteId
                ? apiClient.get(`/inventario/${varianteId}/kardex`, { tamanoPagina: 100 })
                : Promise.resolve({ total: 0, items: [] }),
        [varianteId]
    );

    const openDialog = (m: "entrada" | "ajuste") => {
        setMode(m);
        setCantidad("");
        setMotivo("");
        setActionError(null);
        setOpen(true);
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!varianteId) return;
        setSaving(true);
        setActionError(null);
        try {
            const body =
                mode === "entrada"
                    ? { cantidad: Number(cantidad), motivo: motivo || undefined }
                    : { cantidad: Number(cantidad), motivo };
            await apiClient.post(`/inventario/${varianteId}/${mode === "entrada" ? "entradas" : "ajustes"}`, body);
            setOpen(false);
            existencias.reload();
            kardex.reload();
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const kardexColumns: Column<KardexDto>[] = [
        { key: "id", label: "ID" },
        { key: "fechaRegistro", label: "Fecha", render: (k) => formatDateTime(k.fechaRegistro) },
        { key: "tipoMovimiento", label: "Movimiento" },
        { key: "cantidad", label: "Cantidad", align: "right", render: (k) => formatNumber(k.cantidad) },
        { key: "existenciaNueva", label: "Existencia nueva", align: "right", render: (k) => formatNumber(k.existenciaNueva) },
        { key: "motivo", label: "Motivo", render: (k) => k.motivo ?? "—" },
        { key: "usuario", label: "Usuario", render: (k) => k.usuario ?? "—" },
    ];

    const e = existencias.data;

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 2 , fontWeight: 700 }}>
                Control de inventario
            </Typography>

            <Stack direction="row" spacing={2} sx={{  mb: 2 , alignItems: "center" }}>
                <TextField
                    select
                    size="small"
                    label="Producto"
                    value={productoId}
                    onChange={(ev) => {
                        setProductoId(ev.target.value);
                        setVarianteId("");
                    }}
                    sx={{ minWidth: 260 }}
                >
                    {(productos?.items ?? []).map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                            {p.nombre}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Variante"
                    value={varianteId}
                    onChange={(ev) => setVarianteId(ev.target.value)}
                    sx={{ minWidth: 220 }}
                    disabled={!productoId}
                >
                    {(producto?.variantes ?? []).map((v) => (
                        <MenuItem key={v.id} value={String(v.id)}>
                            {v.sku}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Existencia física
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {formatNumber(e?.existenciaFisica)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Reservada
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {formatNumber(e?.existenciaReservada)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Disponible
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {formatNumber(e?.existenciaDisponible)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {canManage && varianteId ? (
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={() => openDialog("entrada")}>
                        Registrar entrada
                    </Button>
                    <Button variant="outlined" onClick={() => openDialog("ajuste")}>
                        Registrar ajuste
                    </Button>
                </Stack>
            ) : null}

            <Typography variant="h6" sx={{  mb: 1 , fontWeight: 600 }}>
                Kardex
            </Typography>
            <SimpleTable
                rows={kardex.data?.items ?? []}
                columns={kardexColumns}
                loading={kardex.loading}
                error={kardex.error}
                rowKey={(k) => k.id}
                emptyText="Selecciona una variante para ver su kardex"
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <Box component="form" onSubmit={submit}>
                    <DialogTitle>{mode === "entrada" ? "Registrar entrada" : "Registrar ajuste"}</DialogTitle>
                    <DialogContent>
                        {actionError ? <Typography color="error">{actionError}</Typography> : null}
                        <TextField
                            fullWidth
                            required
                            type="number"
                            label="Cantidad"
                            value={cantidad}
                            onChange={(ev) => setCantidad(ev.target.value)}
                            margin="dense"
                            helperText={mode === "ajuste" ? "Puede ser negativa" : undefined}
                        />
                        <TextField
                            fullWidth
                            required={mode === "ajuste"}
                            label="Motivo"
                            value={motivo}
                            onChange={(ev) => setMotivo(ev.target.value)}
                            margin="dense"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? "Guardando…" : "Guardar"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
}