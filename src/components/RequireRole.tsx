import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "../storage/AppState";
import { hasRol } from "../client/roles";

interface RequireRoleProps {
    roles: string[];
    children: ReactNode;
}

/**
 * Protege una ruta por rol. Si el usuario autenticado no tiene uno de los
 * roles permitidos, redirige a la ruta raíz ("/").
 * La comparación es insensible a mayúsculas/minúsculas y acentos.
 */
export default function RequireRole({ roles, children }: RequireRoleProps) {
    const rol = useAuthStore((state) => state.user?.rol);
    if (!hasRol(rol, roles)) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
