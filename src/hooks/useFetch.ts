import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
    setData: (data: T | null) => void;
}

/** Hook genérico para cargar datos asíncronos con estado de carga/error y recarga manual. */
export function useFetch<T>(fn: () => Promise<T>, deps: DependencyList = []): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const fnRef = useRef(fn);
    fnRef.current = fn;

    const reload = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fnRef.current()
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Error inesperado");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, ...deps]);

    return { data, loading, error, reload, setData };
}
