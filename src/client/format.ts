export function formatMoney(value: number | null | undefined): string {
    if (value == null) return "—";
    return `Q${Number(value).toFixed(2)}`;
}

export function formatNumber(value: number | null | undefined): string {
    if (value == null) return "—";
    return Number(value).toLocaleString();
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

/** Convierte una fecha "YYYY-MM-DD" al inicio/fin del día (formato date-time esperado por el API). */
export function toIsoDay(dateStr: string, endOfDay: boolean): string {
    return endOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
}

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

export function daysAgoIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
}
