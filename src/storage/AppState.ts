import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../client/ApiClient";
import { decodeJwtUser } from "../client/jwt";
import type { TokenPair, User } from "../client/model/ApiModel";

export interface UserProfile {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    authenticated: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, nombre?: string) => Promise<void>;
    logout: () => void;
    setAuth: (pair: TokenPair, fallbackEmail?: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<UserProfile>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            authenticated: false,
            error: null,

            login: async (email, password) => {
                try {
                    const pair = await apiClient.post<TokenPair>("/auth/login", { email, password });
                    get().setAuth(pair, email);
                    set({ error: null });
                } catch (e) {
                    set({ error: e instanceof Error ? e.message : "Error al iniciar sesión" });
                    throw e;
                }
            },

            register: async (email, password, nombre) => {
                try {
                    const pair = await apiClient.post<TokenPair>("/auth/register", {
                        email,
                        password,
                        nombre,
                    });
                    get().setAuth(pair, email);
                    set({ error: null });
                } catch (e) {
                    set({ error: e instanceof Error ? e.message : "Error al registrarse" });
                    throw e;
                }
            },

            logout: () => get().clearAuth(),

            setAuth: (pair, fallbackEmail) => {
                const user = decodeJwtUser(pair.accessToken, fallbackEmail);
                set({
                    accessToken: pair.accessToken,
                    refreshToken: pair.refreshToken,
                    user,
                    authenticated: true,
                });
            },

            clearAuth: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    authenticated: false,
                    error: null,
                }),
        }),
        {
            name: "shopcart-auth",
            // El refreshToken NO se persiste: su lugar es una cookie httpOnly (backend).
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                authenticated: state.authenticated,
            }),
        }
    )
);

// Mantiene el token del ApiClient sincronizado con el store (incluida la rehidratación).
useAuthStore.subscribe((state) => {
    apiClient.setTokens(state.accessToken, state.refreshToken);
});

// Cuando el ApiClient renueva el token, actualiza el store (mantiene la sesión viva).
apiClient.setOnTokensRefreshed((pair) => {
    useAuthStore.setState((state) => ({
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken ?? state.refreshToken,
        authenticated: true,
    }));
});

// Si la renovación falla (refresh inválido/revocado), cierra la sesión.
apiClient.setOnUnauthorized(() => {
    useAuthStore.getState().clearAuth();
});


