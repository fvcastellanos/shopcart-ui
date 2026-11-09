import { useEffect, useState } from "react";
import {
    Alert,
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
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { apiClient, getErrorMessage } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import { formatMoney } from "../client/format";
import type {
    CarritoDto,
    CarritoItemDto,
    CarritoResponse,
    DireccionDto,
    Paginated,
    PedidoDto,
    ProductoDto,
} from "../client/model/ApiModel";

const CART_KEY = "shopcart-cart-id";

function readCartId(): number | null {
    const value = localStorage.getItem(CART_KEY);
    const id = value ? Number(value) : null;
    return id && Number.isFinite(id) ? id : null;
}

function genIdempotencyKey(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function Carrito() {
    const [cartId, setCartId] = useState<number | null>(() => readCartId());
    const [addOpen, setAddOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [productoId, setProductoId] = useState("");
    const [varianteId, setVarianteId] = useState("");
    const [cantidad, setCantidad] = useState("1");
    const [direccionId, setDireccionId] = useState("");
    const [codigoCupon, setCodigoCupon] = useState("");
    const [notice, setNotice] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Crea un carrito si aún no existe.
    useEffect(() => {
        if (cartId !== null) return;
        let cancelled = false;
        apiClient
            .post<CarritoDto>("/carrito", {})
            .then((c) => {
                if (cancelled) return;
                localStorage.setItem(CART_KEY, String(c.id));
                setCartId(c.id);
            })
            .catch((err: unknown) => {
                if (!cancelled) setActionError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [cartId]);

    const carrito = useFetch<CarritoResponse | null>(
        () => (cartId !== null ? apiClient.get(`/carrito/${cartId}`) : Promise.resolve(null)),
        [cartId]
    );

    const productos = useFetch<Paginated<ProductoDto>>(
        () => apiClient.get("/productos", { tamanoPagina: 100 }),
        []
    );

    const producto = useFetch<ProductoDto | null>(
        () => (productoId ? apiClient.get<ProductoDto>(`/productos/${productoId}`) : Promise.resolve(null)),
        [productoId]
    );

    const direcciones = useFetch<DireccionDto[]>(() => apiClient.get("/direcciones"), []);

    const addItem = async () => {
        if (!cartId || !varianteId) return;
        setSaving(true);
        setActionError(null);
        try {
            await apiClient.post(`/carrito/${cartId}/items`, {
                idVariante: Number(varianteId),
                cantidad: Number(cantidad),
            });
            setAddOpen(false);
            setVarianteId("");
            setCantidad("1");
            carrito.reload();
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const updateQuantity = async (item: CarritoItemDto, nuevaCantidad: number) => {
        if (!cartId) return;
        try {
            await apiClient.put(`/carrito/${cartId}/items/${item.idVariante}`, { cantidad: nuevaCantidad });
            carrito.reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const removeItem = async (item: CarritoItemDto) => {
        if (!cartId) return;
        try {
            await apiClient.delete(`/carrito/${cartId}/items/${item.idVariante}`);
            carrito.reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const clearCart = async () => {
        if (!cartId) return;
        try {
            await apiClient.delete(`/carrito/${cartId}/items`);
            carrito.reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const checkout = async () => {
        if (!cartId || !direccionId) return;
        setSaving(true);
        setActionError(null);
        try {
            const pedido = await apiClient.post<PedidoDto>("/pedidos", {
                idCarrito: cartId,
                idDireccion: Number(direccionId),
                codigoCupon: codigoCupon || undefined,
                claveIdempotencia: genIdempotencyKey(),
            });
            setCheckoutOpen(false);
            setNotice(`Pedido creado con éxito. Seguimiento: ${pedido.numeroSeguimiento}`);
            carrito.reload();
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<CarritoItemDto>[] = [
        { key: "producto", label: "Producto" },
        { key: "sku", label: "SKU" },
        { key: "precio", label: "Precio", align: "right", render: (i) => formatMoney(i.precio) },
        {
            key: "cantidad",
            label: "Cantidad",
            align: "center",
            render: (i) => (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
                    <Button size="small" onClick={() => updateQuantity(i, i.cantidad - 1)}>
                        −
                    </Button>
                    <Typography>{i.cantidad}</Typography>
                    <Button size="small" onClick={() => updateQuantity(i, i.cantidad + 1)}>
                        +
                    </Button>
                </Stack>
            ),
        },
        { key: "subtotalLinea", label: "Subtotal", align: "right", render: (i) => formatMoney(i.subtotalLinea) },
        {
            key: "acciones",
            label: "",
            render: (i) => (
                <Button size="small" color="error" onClick={() => removeItem(i)}>
                    Quitar
                </Button>
            ),
        },
    ];

    const items = carrito.data?.items ?? [];
    const subtotal = carrito.data?.subtotal ?? 0;

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 2 , fontWeight: 700 }}>
                Carrito de compras
            </Typography>

            {notice ? (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
                    {notice}
                </Alert>
            ) : null}

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                    Agregar producto
                </Button>
                <Button variant="outlined" startIcon={<DeleteSweepIcon />} onClick={clearCart} disabled={items.length === 0}>
                    Vaciar carrito
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<ShoppingCartCheckoutIcon />}
                    onClick={() => setCheckoutOpen(true)}
                    disabled={items.length === 0}
                >
                    Finalizar compra
                </Button>
            </Stack>

            <SimpleTable
                rows={items}
                columns={columns}
                loading={carrito.loading}
                error={carrito.error}
                rowKey={(i) => i.id}
                emptyText="El carrito está vacío"
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Typography variant="h6">
                    Subtotal: <strong>{formatMoney(subtotal)}</strong>
                </Typography>
            </Box>

            <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Agregar producto</DialogTitle>
                <DialogContent>
                    {actionError ? <Typography color="error">{actionError}</Typography> : null}
                    <TextField
                        select
                        fullWidth
                        label="Producto"
                        value={productoId}
                        onChange={(e) => {
                            setProductoId(e.target.value);
                            setVarianteId("");
                        }}
                        margin="dense"
                    >
                        {(productos.data?.items ?? []).map((p) => (
                            <MenuItem key={p.id} value={String(p.id)}>
                                {p.nombre}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        fullWidth
                        label="Variante"
                        value={varianteId}
                        onChange={(e) => setVarianteId(e.target.value)}
                        margin="dense"
                        disabled={!productoId}
                    >
                        {(producto.data?.variantes ?? []).map((v) => (
                            <MenuItem key={v.id} value={String(v.id)}>
                                {v.sku} — {formatMoney(v.precio)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        type="number"
                        label="Cantidad"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={addItem} disabled={saving || !varianteId}>
                        {saving ? "Agregando…" : "Agregar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Finalizar compra</DialogTitle>
                <DialogContent>
                    {actionError ? <Typography color="error">{actionError}</Typography> : null}
                    <TextField
                        select
                        fullWidth
                        required
                        label="Dirección de entrega"
                        value={direccionId}
                        onChange={(e) => setDireccionId(e.target.value)}
                        margin="dense"
                    >
                        {(direcciones.data ?? []).map((d) => (
                            <MenuItem key={d.id} value={String(d.id)}>
                                {d.linea1}, {d.ciudad}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Cupón (opcional)"
                        value={codigoCupon}
                        onChange={(e) => setCodigoCupon(e.target.value)}
                        margin="dense"
                    />
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                        Total a pagar: {formatMoney(subtotal)}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
                    <Button variant="contained" color="success" onClick={checkout} disabled={saving || !direccionId}>
                        {saving ? "Procesando…" : "Pagar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}