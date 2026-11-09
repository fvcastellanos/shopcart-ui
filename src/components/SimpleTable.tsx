import {
    Alert,
    Box,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import type { ReactNode } from "react";

export interface Column<T> {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    render?: (row: T) => ReactNode;
}

interface SimpleTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    loading?: boolean;
    error?: string | null;
    emptyText?: string;
    rowKey?: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
}

export function SimpleTable<T>({
    rows,
    columns,
    loading = false,
    error = null,
    emptyText = "No hay registros",
    rowKey = (_row, index) => index,
    onRowClick,
}: SimpleTableProps<T>) {
    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell key={col.key} align={col.align ?? "left"}>
                                {col.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ color: "text.secondary", py: 3 }}>
                                {emptyText}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, index) => (
                            <TableRow
                                key={rowKey(row, index)}
                                hover={Boolean(onRowClick)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                sx={onRowClick ? { cursor: "pointer" } : undefined}
                            >
                                {columns.map((col) => (
                                    <TableCell key={col.key} align={col.align ?? "left"}>
                                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
