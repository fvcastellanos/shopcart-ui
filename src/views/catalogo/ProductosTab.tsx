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
    TablePagination,
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
    const [categoria, setCategoria] = useState("");
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [soloDisponibles, setSoloDisponibles] = useState(false);
    const [ordenarPor, setOrdenarPor] = useState("Nombre");
    const [direccion, setDireccion] = useState<"ASC" | "DESC">("ASC");
    const [pagina, setPagina] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductoDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data: categorias } = useFetch<CategoriaDto[]>(() => apiClient.get("/categorias"), []);
    const { data, loading, error, reload } = useFetch<Paginated<ProductoDto>>(
        () =>
            apiClient.get("/productos", {
                busqueda,
                categoria: categoria || undefined,
                precioMin: precioMin || undefined,
                precioMax: precioMax || undefined,
                soloDisponibles: soloDisponibles || undefined,
                ordenarPor,
                direccion,
                pagina,
                tamanoPagina,
            }),
        [busqueda, categoria, precioMin, precioMax, soloDisponibles, ordenarPor, direccion, pagina, tamanoPagina]
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

    const clearFilters = () => {
        setBusqueda("");
        setCategoria("");
        setPrecioMin("");
        setPrecioMax("");
        setSoloDisponibles(false);
        setOrdenarPor("Nombre");
        setDireccion("ASC");
        setPagina(1);
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
            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }} useFlexGap>
                {canManage ? (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Nuevo producto
                    </Button>
                ) : null}
                <TextField
                    size="small"
                    label="Buscar"
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                        setPagina(1);
                    }}
                    sx={{ width: 200 }}
                />
                <TextField
                    select
                    size="small"
                    label="Categoría"
                    value={categoria}
                    onChange={(e) => {
                        setCategoria(e.target.value);
                        setPagina(1);
                    }}
                    sx={{ minWidth: 160 }}
                >
                    <MenuItem value="">Todas</MenuItem>
                    {(categorias ?? []).map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    size="small"
                    type="number"
                    label="Precio mín"
                    value={precioMin}
                    onChange={(e) => {
                        setPrecioMin(e.target.value);
                        setPagina(1);
                    }}
                    sx={{ width: 120 }}
                />
                <TextField
                    size="small"
                    type="number"
                    label="Precio máx"
                    value={precioMax}
                    onChange={(e) => {
                        setPrecioMax(e.target.value);
                        setPagina(1);
                    }}
                    sx={{ width: 120 }}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={soloDisponibles}
                            onChange={(e) => {
                                setSoloDisponibles(e.target.checked);
                                setPagina(1);
                            }}
                        />
                    }
                    label="Solo disponibles"
                />
                <TextField
                    select
                    size="small"
                    label="Ordenar por"
                    value={ordenarPor}
                    onChange={(e) => {
                        setOrdenarPor(e.target.value);
                        setPagina(1);
                    }}
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="Nombre">Nombre</MenuItem>
                    <MenuItem value="Precio">Precio</MenuItem>
                    <MenuItem value="Recientes">Recientes</MenuItem>
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Dirección"
                    value={direccion}
                    onChange={(e) => {
                        setDireccion(e.target.value as "ASC" | "DESC");
                        setPagina(1);
                    }}
                    sx={{ width: 110 }}
                >
                    <MenuItem value="ASC">Asc</MenuItem>
                    <MenuItem value="DESC">Desc</MenuItem>
                </TextField>
                <Button size="small" onClick={clearFilters}>
                    Limpiar
                </Button>
            </Stack>

            <SimpleTable
                rows={data?.items ?? []}
                columns={columns}
                loading={loading}
                error={error}
                rowKey={(p) => p.id}
            />

            <TablePagination
                component="div"
                count={data?.total ?? 0}
                page={pagina - 1}
                onPageChange={(_e, newPage) => setPagina(newPage + 1)}
                rowsPerPage={tamanoPagina}
                onRowsPerPageChange={(e) => {
                    setTamanoPagina(Number(e.target.value));
                    setPagina(1);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
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
