import type { User } from "./model/ApiModel";

function decodePayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function firstString(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
    return undefined;
}

/**
 * Extrae la información del usuario desde el payload de un JWT.
 * Como el API no expone un endpoint de "perfil", se decodifican las claims
 * más comunes (email/sub, name/nombre, rol/role/roles/authorities).
 */
export function decodeJwtUser(token: string, fallbackEmail?: string): User | null {
    const payload = decodePayload(token);

    const email =
        firstString(payload?.email) ??
        firstString(payload?.sub) ??
        fallbackEmail ??
        "";
    const name = firstString(payload?.name) ?? firstString(payload?.nombre) ?? "";
    const rol =
        firstString(payload?.rol) ??
        firstString(payload?.role) ??
        firstString(payload?.roles) ??
        firstString(payload?.authorities) ??
        "";
    return { email, name, rol };
}