import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { apiClient } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { daysAgoIso, formatMoney, formatNumber, toIsoDay, todayIso } from "../client/format";
import type {
    ProductoVendidoDto,
    ResumenDashboardDto,
    VentasPeriodoDto,
} from "../client/model/ApiModel";

export default function Dashboard() {
    const [fechaDesde, setFechaDesde] = useState(daysAgoIso(30));
    const [fechaHasta, setFechaHasta] = useState(todayIso());
    const [agruparPor, setAgruparPor] = useState("Dia");
    const [top, setTop] = useState(10);

    const desde = toIsoDay(fechaDesde, false);
    const hasta = toIsoDay(fechaHasta, true);

    const resumen = useFetch<ResumenDashboardDto>(
        () => apiClient.get("/dashboard/resumen", { fechaDesde: desde, fechaHasta: hasta }),
        [desde, hasta]
    );

    const ventas = useFetch<VentasPeriodoDto[]>(
        () => apiClient.get("/dashboard/ventas", { fechaDesde: desde, fechaHasta: hasta, agruparPor }),
        [desde, hasta, agruparPor]
    );

    const productos = useFetch<ProductoVendidoDto[]>(
        () => apiClient.get("/dashboard/productos", { fechaDesde: desde, fechaHasta: hasta, top }),
        [desde, hasta, top]
    );

    const ventasColumns: Column<VentasPeriodoDto>[] = [
        { key: "periodo", label: "Periodo" },
        { key: "pedidos", label: "Pedidos", align: "right", render: (r) => formatNumber(r.pedidos) },
        { key: "ventas", label: "Ventas", align: "right", render: (r) => formatMoney(r.ventas) },
    ];

    const productosColumns: Column<ProductoVendidoDto>[] = [
        { key: "producto", label: "Producto" },
        { key: "unidadesVendidas", label: "Unidades", align: "right", render: (r) => formatNumber(r.unidadesVendidas) },
        { key: "totalVendido", label: "Total", align: "right", render: (r) => formatMoney(r.totalVendido) },
    ];

    const metrics = [
        { label: "Total de ventas", value: formatMoney(resumen.data?.totalVentas) },
        { label: "Pedidos", value: formatNumber(resumen.data?.totalPedidos) },
        { label: "Ticket promedio", value: formatMoney(resumen.data?.ticketPromedio) },
    ];

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 3 , fontWeight: 700 }}>
                Dashboard
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }} useFlexGap>
                <TextField
                    type="date"
                    label="Desde"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    size="small"
                />
                <TextField
                    type="date"
                    label="Hasta"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    size="small"
                />
                <TextField
                    select
                    label="Agrupar por"
                    value={agruparPor}
                    onChange={(e) => setAgruparPor(e.target.value)}
                    size="small"
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="Dia">Día</MenuItem>
                    <MenuItem value="Semana">Semana</MenuItem>
                    <MenuItem value="Mes">Mes</MenuItem>
                </TextField>
                <TextField
                    type="number"
                    label="Top productos"
                    value={top}
                    onChange={(e) => setTop(Number(e.target.value) || 10)}
                    size="small"
                    sx={{ width: 140 }}
                />
            </Stack>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {metrics.map((metric) => (
                    <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" variant="body2">
                                    {metric.label}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {metric.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {resumen.error ? (
                <Typography color="error" sx={{ mb: 2 }}>
                    {resumen.error}
                </Typography>
            ) : null}

            <Typography variant="h6" sx={{  mb: 1 , fontWeight: 600 }}>
                Ventas por período
            </Typography>
            <Box sx={{ mb: 3 }}>
                <SimpleTable
                    rows={ventas.data ?? []}
                    columns={ventasColumns}
                    loading={ventas.loading}
                    error={ventas.error}
                    emptyText="Sin datos de ventas en el rango"
                />
            </Box>

            <Typography variant="h6" sx={{  mb: 1 , fontWeight: 600 }}>
                Productos más vendidos
            </Typography>
            <SimpleTable
                rows={productos.data ?? []}
                columns={productosColumns}
                loading={productos.loading}
                error={productos.error}
                emptyText="Sin productos vendidos en el rango"
            />
        </Box>
    );
}
