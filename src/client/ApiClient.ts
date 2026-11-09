// Cliente HTTP tipado para la API de ShopCart.
// Base: /v1 (en desarrollo se hace proxy hacia http://localhost:4000).
import type { TokenPair } from "./model/ApiModel";

const BASE_URL = "/v1";

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(status: number, message: string, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return "Error inesperado";
}

class ApiClient {
    private accessToken: string | null = null;
    // Fallback en memoria mientras el backend no use una cookie httpOnly.
    private refreshToken: string | null = null;
    private refreshPromise: Promise<boolean> | null = null;
    private onUnauthorized: (() => void) | null = null;
    private onTokensRefreshed: ((pair: TokenPair) => void) | null = null;

    setTokens(accessToken: string | null, refreshToken: string | null): void {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    setOnUnauthorized(handler: () => void): void {
        this.onUnauthorized = handler;
    }

    setOnTokensRefreshed(handler: (pair: TokenPair) => void): void {
        this.onTokensRefreshed = handler;
    }

    /**
     * Renueva el accessToken. El refreshToken se espera en una cookie httpOnly
     * (el navegador la envía con credentials: "include"); si aún hay un
     * refreshToken en memoria (backend anterior), se envía como fallback en el body.
     * Usa "single-flight": las peticiones concurrentes comparten la misma renovación.
     */
    refresh(): Promise<boolean> {
        if (!this.refreshPromise) {
            this.refreshPromise = this.doRefresh().finally(() => {
                this.refreshPromise = null;
            });
        }
        return this.refreshPromise;
    }

    private async doRefresh(): Promise<boolean> {
        try {
            const body = this.refreshToken ? { refreshToken: this.refreshToken } : undefined;
            const res = await fetch(`${BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) return false;
            const pair = (await res.json()) as TokenPair;
            this.accessToken = pair.accessToken;
            if (pair.refreshToken) this.refreshToken = pair.refreshToken;
            this.onTokensRefreshed?.(pair);
            return true;
        } catch {
            return false;
        }
    }

    private async request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
        const headers = new Headers(init.headers);
        if (init.body) headers.set("Content-Type", "application/json");
        if (this.accessToken) headers.set("Authorization", `Bearer ${this.accessToken}`);

        const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: "include" });

        const isAuthPath = path === "/auth/refresh" || path === "/auth/login" || path === "/auth/register";

        if (res.status === 401 && !isRetry && !isAuthPath) {
            const refreshed = await this.refresh();
            if (refreshed) {
                return this.request<T>(path, init, true);
            }
            this.onUnauthorized?.();
            throw this.buildError(res, await this.readBody(res));
        }

        if (res.status === 204) return undefined as T;

        const data = await this.readBody(res);

        if (!res.ok) {
            throw this.buildError(res, data);
        }

        return data as T;
    }

    private async readBody(res: Response): Promise<unknown> {
        const text = await res.text();
        if (!text) return undefined;
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    private buildError(res: Response, data: unknown): ApiError {
        const body = data as { error?: { code?: string; message?: string }; message?: string } | undefined;
        const message = body?.error?.message ?? body?.message ?? `Error ${res.status}`;
        return new ApiError(res.status, message, body?.error?.code);
    }

    get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
        const query = new URLSearchParams();
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null && value !== "") {
                    query.set(key, String(value));
                }
            }
        }
        const qs = query.toString();
        return this.request<T>(qs ? `${path}?${qs}` : path);
    }

    post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: "POST",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }

    put<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
    }

    patch<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
    }

    delete<T>(path: string): Promise<T> {
        return this.request<T>(path, { method: "DELETE" });
    }
}

export const apiClient = new ApiClient();
