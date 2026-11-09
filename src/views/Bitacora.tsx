import { useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { apiClient } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { daysAgoIso, formatDateTime, toIsoDay, todayIso } from "../client/format";
import type { BitacoraDto, Paginated } from "../client/model/ApiModel";

export default function Bitacora() {
    const [entidad, setEntidad] = useState("");
    const [fechaDesde, setFechaDesde] = useState(daysAgoIso(30));
    const [fechaHasta, setFechaHasta] = useState(todayIso());

    const desde = toIsoDay(fechaDesde, false);
    const hasta = toIsoDay(fechaHasta, true);

    const { data, loading, error } = useFetch<Paginated<BitacoraDto>>(
        () => apiClient.get("/bitacora", { entidad, fechaDesde: desde, fechaHasta: hasta, tamanoPagina: 100 }),
        [entidad, desde, hasta]
    );

    const columns: Column<BitacoraDto>[] = [
        { key: "id", label: "ID" },
        { key: "fecha", label: "Fecha", render: (b) => formatDateTime(b.fecha) },
        { key: "usuario", label: "Usuario" },
        { key: "entidad", label: "Entidad" },
        { key: "accion", label: "Acción" },
        { key: "valorAnterior", label: "Valor anterior", render: (b) => b.valorAnterior ?? "—" },
        { key: "valorNuevo", label: "Valor nuevo", render: (b) => b.valorNuevo ?? "—" },
    ];

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 2 , fontWeight: 700 }}>
                Bitácora de auditoría
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }} useFlexGap>
                <TextField
                    size="small"
                    label="Entidad"
                    value={entidad}
                    onChange={(e) => setEntidad(e.target.value)}
                    sx={{ width: 200 }}
                />
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

            <SimpleTable
                rows={data?.items ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(b) => b.id}
                emptyText="Sin movimientos de auditoría"
            />
        </Box>
    );
}
