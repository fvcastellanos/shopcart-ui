// Helpers para interpretar el rol del usuario (claim "rol" del JWT).
// Se comparan de forma insensible a mayúsculas para tolerar variantes como
// "Administrador", "ADMIN", "Operador", "Cliente", etc.

// Nombres canónicos de rol devueltos por el backend (claim "rol" del JWT).
// Fuente única de verdad para la navegación y la protección de rutas.
export const ROL = {
    ADMINISTRADOR: "Administrador",
    OPERADOR: "Operador",
    CLIENTE: "Cliente",
} as const;

export type RolNombre = (typeof ROL)[keyof typeof ROL];

function normalizeRol(rol: string | null | undefined): string {
    return (rol ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Indica si el rol del usuario coincide con alguno de los roles permitidos.
 * La comparación es insensible a mayúsculas/minúsculas y a acentos.
 */
export function hasRol(rol: string | null | undefined, roles: readonly string[]): boolean {
    const normalized = normalizeRol(rol);
    if (!normalized) return false;
    return roles.some((r) => normalizeRol(r) === normalized);
}

export function isAdmin(rol: string | null | undefined): boolean {
    return Boolean(rol) && /admin/i.test(rol ?? "");
}

export function isOperador(rol: string | null | undefined): boolean {
    return Boolean(rol) && /oper/i.test(rol ?? "");
}

export function isCliente(rol: string | null | undefined): boolean {
    return Boolean(rol) && /client/i.test(rol ?? "");
}

/** Personal con privilegios de gestión (administrador u operador). */
export function isStaff(rol: string | null | undefined): boolean {
    return isAdmin(rol) || isOperador(rol);
}
