import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiClient, getErrorMessage } from "../../client/ApiClient";
import { useFetch } from "../../hooks/useFetch";
import type { AtributoDto, VarianteAtributoDto, VarianteDto } from "../../client/model/ApiModel";

interface VarianteAtributosDialogProps {
    variante: VarianteDto;
    onClose: () => void;
    onChanged: () => void;
}

export default function VarianteAtributosDialog({ variante, onClose, onChanged }: VarianteAtributosDialogProps) {
    const [current, setCurrent] = useState<VarianteDto>(variante);
    const [valores, setValores] = useState<Record<number, string>>({});
    const [nuevoId, setNuevoId] = useState("");
    const [nuevoValor, setNuevoValor] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: catalogo } = useFetch<AtributoDto[]>(() => apiClient.get("/atributos"), []);

    useEffect(() => {
        const map: Record<number, string> = {};
        for (const a of current.atributos ?? []) map[a.idAtributo] = a.valor;
        setValores(map);
    }, [current]);

    const asociados = current.atributos ?? [];
    const disponibles = (catalogo ?? []).filter(
        (a) => a.activo && !asociados.some((x) => x.idAtributo === a.id),
    );

    const guardarValor = async (idAtributo: number) => {
        setSaving(true);
        setError(null);
        try {
            const res = await apiClient.put<VarianteDto>(
                `/variantes/${current.id}/atributos/${idAtributo}`,
                { valor: valores[idAtributo] },
            );
            setCurrent(res);
            onChanged();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const quitar = async (idAtributo: number) => {
        setSaving(true);
        setError(null);
        try {
            await apiClient.delete(`/variantes/${current.id}/atributos/${idAtributo}`);
            setCurrent((c) => ({
                ...c,
                atributos: (c.atributos ?? []).filter((a) => a.idAtributo !== idAtributo),
            }));
            onChanged();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const agregar = async () => {
        if (!nuevoId) return;
        setSaving(true);
        setError(null);
        try {
            const res = await apiClient.post<VarianteDto>(`/variantes/${current.id}/atributos`, {
                idAtributo: Number(nuevoId),
                valor: nuevoValor,
            });
            setCurrent(res);
            setNuevoId("");
            setNuevoValor("");
            onChanged();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const guardarDisabled = (a: VarianteAtributoDto) => saving || (valores[a.idAtributo] ?? "") === a.valor;

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Atributos de la variante</DialogTitle>
            <DialogContent>
                {error ? (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                ) : null}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {current.sku}
                </Typography>

                {asociados.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Sin atributos asociados
                    </Typography>
                ) : (
                    <Stack spacing={1} sx={{ mb: 2 }}>
                        {asociados.map((a) => (
                            <Stack key={a.idAtributo} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <Typography sx={{ width: 160, flexShrink: 0 }}>{a.nombre}</Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label="Valor"
                                    value={valores[a.idAtributo] ?? ""}
                                    onChange={(e) =>
                                        setValores((prev) => ({ ...prev, [a.idAtributo]: e.target.value }))
                                    }
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={guardarDisabled(a)}
                                    onClick={() => guardarValor(a.idAtributo)}
                                >
                                    Guardar
                                </Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    disabled={saving}
                                    onClick={() => quitar(a.idAtributo)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>
                )}

                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TextField
                        select
                        size="small"
                        label="Atributo"
                        value={nuevoId}
                        onChange={(e) => setNuevoId(e.target.value)}
                        sx={{ width: 200 }}
                    >
                        {disponibles.map((a) => (
                            <MenuItem key={a.id} value={String(a.id)}>
                                {a.nombre}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        size="small"
                        label="Valor"
                        value={nuevoValor}
                        onChange={(e) => setNuevoValor(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        disabled={saving || !nuevoId || !nuevoValor}
                        onClick={agregar}
                    >
                        Agregar
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
