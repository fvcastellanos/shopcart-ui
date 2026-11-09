import { useState } from "react";
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
import { apiClient, getErrorMessage } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { daysAgoIso, formatDateTime, formatMoney, formatNumber, toIsoDay, todayIso } from "../client/format";
import type {
    DetallePedidoDto,
    HistorialEstadoDto,
    Paginated,
    PedidoDetalleResponse,
    PedidoDto,
} from "../client/model/ApiModel";
import { isStaff } from "../client/roles";
import { useAuthStore } from "../storage/AppState";

const ESTADOS = ["PENDIENTE", "PAGADO", "EN_PREPARACION", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

export default function Pedidos() {
    const rol = useAuthStore((state) => state.user?.rol);
    const staff = isStaff(rol);

    const [estado, setEstado] = useState("");
    const [fechaDesde, setFechaDesde] = useState(daysAgoIso(30));
    const [fechaHasta, setFechaHasta] = useState(todayIso());

    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState<PedidoDetalleResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [nuevoEstado, setNuevoEstado] = useState("");
    const [devolucionOpen, setDevolucionOpen] = useState(false);
    const [devoluciones, setDevoluciones] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const desde = toIsoDay(fechaDesde, false);
    const hasta = toIsoDay(fechaHasta, true);

    const { data, loading, error, reload } = useFetch<Paginated<PedidoDto>>(
        () =>
            staff
                ? apiClient.get("/pedidos", { estado, fechaDesde: desde, fechaHasta: hasta, tamanoPagina: 100 })
                : apiClient.get("/pedidos/mios"),
        [staff, estado, desde, hasta]
    );

    const openDetail = async (id: number) => {
        setDetailOpen(true);
        setDetail(null);
        setDetailLoading(true);
        setActionError(null);
        setNuevoEstado("");
        try {
            const res = await apiClient.get<PedidoDetalleResponse>(`/pedidos/${id}`);
            setDetail(res);
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setDetailLoading(false);
        }
    };

    const changeEstado = async (id: number) => {
        if (!nuevoEstado) return;
        setSaving(true);
        setActionError(null);
        try {
            await apiClient.patch(`/pedidos/${id}/estado`, { estadoNuevo: nuevoEstado });
            setNuevoEstado("");
            await openDetail(id);
            reload();
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const openDevolucion = () => {
        const map: Record<string, string> = {};
        for (const linea of detail?.detalle ?? []) {
            map[String(linea.id)] = "0";
        }
        setDevoluciones(map);
        setActionError(null);
        setDevolucionOpen(true);
    };

    const submitDevolucion = async (id: number) => {
        const lineas = Object.entries(devoluciones)
            .filter(([, cantidad]) => Number(cantidad) > 0)
            .map(([idDetallePedido, cantidad]) => ({
                idDetallePedido: Number(idDetallePedido),
                cantidad: Number(cantidad),
            }));
        if (lineas.length === 0) {
            setActionError("Indica al menos una cantidad a devolver");
            return;
        }
        setSaving(true);
        setActionError(null);
        try {
            await apiClient.post(`/pedidos/${id}/devoluciones`, { lineas });
            setDevolucionOpen(false);
            await openDetail(id);
            reload();
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<PedidoDto>[] = [
        { key: "id", label: "ID" },
        { key: "numeroSeguimiento", label: "Seguimiento" },
        { key: "correo", label: "Cliente" },
        { key: "estado", label: "Estado" },
        { key: "total", label: "Total", align: "right", render: (p) => formatMoney(p.total) },
        { key: "fechaCreacion", label: "Fecha", render: (p) => formatDateTime(p.fechaCreacion) },
    ];

    const detalleColumns: Column<DetallePedidoDto>[] = [
        { key: "sku", label: "SKU" },
        { key: "producto", label: "Producto" },
        { key: "cantidad", label: "Cantidad", align: "right", render: (d) => formatNumber(d.cantidad) },
        { key: "precioUnitario", label: "Precio unit.", align: "right", render: (d) => formatMoney(d.precioUnitario) },
        { key: "descuentoLinea", label: "Descuento", align: "right", render: (d) => formatMoney(d.descuentoLinea) },
        { key: "cantidadDevuelta", label: "Devuelto", align: "right", render: (d) => formatNumber(d.cantidadDevuelta) },
    ];

    const historialColumns: Column<HistorialEstadoDto>[] = [
        { key: "fecha", label: "Fecha", render: (h) => formatDateTime(h.fecha) },
        { key: "estadoAnterior", label: "Anterior", render: (h) => h.estadoAnterior ?? "—" },
        { key: "estadoNuevo", label: "Nuevo" },
        { key: "usuario", label: "Usuario", render: (h) => h.usuario ?? "—" },
    ];

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 2 , fontWeight: 700 }}>
                {staff ? "Pedidos" : "Mis pedidos"}
            </Typography>

            {staff ? (
                <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }} useFlexGap>
                    <TextField
                        select
                        size="small"
                        label="Estado"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {ESTADOS.map((e) => (
                            <MenuItem key={e} value={e}>
                                {e}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        size="small"
                        type="date"
                        label="Desde"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        size="small"
                        type="date"
                        label="Hasta"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Stack>
            ) : null}

            <SimpleTable
                rows={data?.items ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(p) => p.id}
                onRowClick={(p) => openDetail(p.id)}
                emptyText="No hay pedidos"
            />

            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    Pedido {detail ? `#${detail.pedido.id} · ${detail.pedido.numeroSeguimiento}` : ""}
                </DialogTitle>
                <DialogContent>
                    {detailLoading ? <Typography>Cargando…</Typography> : null}
                    {actionError ? <Typography color="error">{actionError}</Typography> : null}

                    {detail ? (
                        <>
                            <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: "wrap" }} useFlexGap>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Estado</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{detail.pedido.estado}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Cliente</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{detail.pedido.correo}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Fecha</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{formatDateTime(detail.pedido.fechaCreacion)}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Subtotal</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{formatMoney(detail.pedido.subtotal)}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Descuento</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{formatMoney(detail.pedido.descuento)}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Total</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{formatMoney(detail.pedido.total)}</Typography>
                                </Box>
                            </Stack>

                            {staff ? (
                                <Stack direction="row" spacing={2} sx={{  mb: 2 , alignItems: "center" }}>
                                    <TextField
                                        select
                                        size="small"
                                        label="Nuevo estado"
                                        value={nuevoEstado}
                                        onChange={(e) => setNuevoEstado(e.target.value)}
                                        sx={{ minWidth: 200 }}
                                    >
                                        {ESTADOS.map((e) => (
                                            <MenuItem key={e} value={e}>
                                                {e}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <Button
                                        variant="contained"
                                        disabled={!nuevoEstado || saving}
                                        onClick={() => changeEstado(detail.pedido.id)}
                                    >
                                        Cambiar estado
                                    </Button>
                                    <Button variant="outlined" color="warning" onClick={openDevolucion}>
                                        Registrar devolución
                                    </Button>
                                </Stack>
                            ) : null}

                            <Typography variant="h6" sx={{  mt: 1, mb: 1 , fontWeight: 600 }}>
                                Detalle
                            </Typography>
                            <SimpleTable rows={detail.detalle} columns={detalleColumns} rowKey={(d) => d.id} />

                            <Typography variant="h6" sx={{  mt: 2, mb: 1 , fontWeight: 600 }}>
                                Historial de estados
                            </Typography>
                            <SimpleTable
                                rows={detail.historial}
                                columns={historialColumns}
                                rowKey={(h) => h.id}
                                emptyText="Sin historial"
                            />
                        </>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={devolucionOpen} onClose={() => setDevolucionOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Registrar devolución</DialogTitle>
                <DialogContent>
                    {actionError ? <Typography color="error">{actionError}</Typography> : null}
                    {(detail?.detalle ?? []).map((linea) => (
                        <Stack key={linea.id} direction="row" spacing={2} sx={{  mb: 1 , alignItems: "center" }}>
                            <Typography sx={{ flexGrow: 1 }}>
                                {linea.producto} ({linea.sku})
                            </Typography>
                            <TextField
                                type="number"
                                size="small"
                                label="Cantidad"
                                value={devoluciones[String(linea.id)] ?? "0"}
                                onChange={(e) =>
                                    setDevoluciones((prev) => ({ ...prev, [String(linea.id)]: e.target.value }))
                                }
                                sx={{ width: 120 }}
                            />
                        </Stack>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDevolucionOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={saving || !detail}
                        onClick={() => detail && submitDevolucion(detail.pedido.id)}
                    >
                        {saving ? "Procesando…" : "Registrar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}