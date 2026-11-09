// ===== Autenticación =====
export interface User {
    email: string;
    name: string;
    rol: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    nombre?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

// ===== Categorías =====
export interface CategoriaRequest {
    nombre: string;
}

export interface CategoriaDto {
    id: number;
    nombre: string;
    activo: boolean;
}

// ===== Productos y Variantes =====
export interface ProductoRequest {
    nombre: string;
    descripcion?: string;
    idCategoria: number;
}

export interface AtributoDto {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface AtributoRequest {
    nombre: string;
}

export interface VarianteAtributoDto {
    idAtributo: number;
    nombre: string;
    valor: string;
}

export interface VarianteAtributoRequest {
    idAtributo: number;
    valor: string;
}

export interface VarianteRequest {
    idProducto: number;
    sku: string;
    precio: number;
    existencia: number;
}

export interface VarianteUpdateRequest {
    precio: number;
    existencia: number;
    activo: boolean;
}

export interface VarianteDto {
    id: number;
    idProducto: number;
    sku: string;
    precio: number;
    existencia: number;
    activo: boolean;
    atributos?: VarianteAtributoDto[];
}

export interface ProductoDto {
    id: number;
    nombre: string;
    descripcion?: string;
    idCategoria: number;
    categoria: string;
    precioDesde: number;
    precioHasta: number;
    existenciaTotal: number;
    activo: boolean;
    totalRegistros: number;
    variantes?: VarianteDto[];
}

// ===== Inventario =====
export interface ExistenciaDto {
    idVariante: number;
    sku: string;
    existenciaFisica: number;
    existenciaReservada: number;
    existenciaDisponible: number;
}

export interface KardexDto {
    id: number;
    idVariante: number;
    tipoMovimiento: string;
    cantidad: number;
    existenciaNueva: number;
    motivo?: string;
    idUsuario?: number;
    usuario?: string;
    fechaRegistro: string;
}

// ===== Carrito =====
export interface CarritoDto {
    id: number;
    idUsuario?: number;
    token?: string;
    fechaCreacion: string;
    fechaUltimaActividad: string;
}

export interface CarritoItemDto {
    id: number;
    idCarrito: number;
    idVariante: number;
    cantidad: number;
    sku: string;
    precio: number;
    idProducto: number;
    producto: string;
    subtotalLinea: number;
    subtotal: number;
    reservado: number;
}

export interface CarritoItemRequest {
    idVariante: number;
    cantidad: number;
}

export interface CarritoResponse {
    items: CarritoItemDto[];
    subtotal: number;
}

// ===== Cupones =====
export interface CuponRequest {
    codigo: string;
    tipo: string;
    valor: number;
    montoMinimo: number;
    fechaInicio: string;
    fechaFin: string;
    limiteTotalUsos?: number;
    limiteUsoPorCliente?: number;
    idCategoria?: number;
}

export interface CuponDto {
    id: number;
    codigo: string;
    tipo: string;
    valor: number;
    montoMinimo: number;
    fechaInicio: string;
    fechaFin: string;
    limiteTotalUsos?: number;
    limiteUsoPorCliente?: number;
    totalUsos: number;
    idCategoria?: number;
    categoria?: string;
    activo: boolean;
}

// ===== Direcciones =====
export interface DireccionRequest {
    linea1: string;
    linea2?: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    referencia?: string;
    esPrincipal?: boolean;
}

export interface DireccionDto {
    id: number;
    idUsuario: number;
    linea1: string;
    linea2?: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    referencia?: string;
    esPrincipal: boolean;
    activo: boolean;
}

// ===== Reservas =====
export interface ReservaRequest {
    idCarrito: number;
    duracionMinutos?: number;
}

export interface ReservaDto {
    id: number;
    idVariante: number;
    cantidad: number;
    estado: string;
    fechaExpiracion: string;
}

// ===== Pedidos =====
export interface PedidoRequest {
    idCarrito: number;
    idDireccion: number;
    codigoCupon?: string;
    claveIdempotencia: string;
}

export interface PedidoDto {
    id: number;
    idUsuario: number;
    correo: string;
    idDireccion: number;
    idCupon?: number;
    codigoCupon?: string;
    estado: string;
    subtotal: number;
    descuento: number;
    total: number;
    numeroSeguimiento: string;
    fechaCreacion: string;
    detalle?: DetallePedidoDto[];
    historial?: HistorialEstadoDto[];
}

export interface DetallePedidoDto {
    id: number;
    idVariante: number;
    cantidad: number;
    precioUnitario: number;
    descuentoLinea: number;
    cantidadDevuelta: number;
    sku: string;
    producto: string;
}

export interface HistorialEstadoDto {
    id: number;
    estadoAnterior?: string;
    estadoNuevo: string;
    idUsuario?: number;
    usuario?: string;
    fecha: string;
}

export interface PedidoDetalleResponse {
    pedido: PedidoDto;
    detalle: DetallePedidoDto[];
    historial: HistorialEstadoDto[];
}

// ===== Dashboard =====
export interface VentasPeriodoDto {
    periodo: string;
    ventas: number;
    pedidos: number;
}

export interface ProductoVendidoDto {
    idProducto: number;
    producto: string;
    unidadesVendidas: number;
    totalVendido: number;
}

export interface ResumenDashboardDto {
    totalVentas: number;
    totalPedidos: number;
    ticketPromedio: number;
}

// ===== Bitácora =====
export interface BitacoraDto {
    id: number;
    idUsuario?: number;
    usuario?: string;
    entidad: string;
    accion: string;
    valorAnterior?: string;
    valorNuevo?: string;
    fecha: string;
}

// ===== Genérico de paginación =====
export interface Paginated<T> {
    total: number;
    items: T[];
}

