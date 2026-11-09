import { useState } from "react";
import { Formik } from "formik";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiClient, getErrorMessage } from "../client/ApiClient";
import { useFetch } from "../hooks/useFetch";
import { SimpleTable, type Column } from "../components/SimpleTable";
import type { DireccionDto, DireccionRequest } from "../client/model/ApiModel";
import { direccionSchema } from "../validation/direccion";
import FormikTextField from "../components/FormikTextField";

interface DireccionValues {
    linea1: string;
    linea2: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    referencia: string;
    esPrincipal: boolean;
}

const emptyValues: DireccionValues = {
    linea1: "",
    linea2: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
    referencia: "",
    esPrincipal: false,
};

function toRequest(values: DireccionValues): DireccionRequest {
    return {
        linea1: values.linea1,
        linea2: values.linea2 || undefined,
        ciudad: values.ciudad,
        departamento: values.departamento,
        codigoPostal: values.codigoPostal,
        referencia: values.referencia || undefined,
        esPrincipal: values.esPrincipal,
    };
}

export default function Direcciones() {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DireccionDto | null>(null);
    const [formKey, setFormKey] = useState(0);

    const { data, loading, error, reload } = useFetch<DireccionDto[]>(
        () => apiClient.get("/direcciones"),
        []
    );

    const openCreate = () => {
        setEditing(null);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const openEdit = (d: DireccionDto) => {
        setEditing(d);
        setFormKey((k) => k + 1);
        setOpen(true);
    };

    const remove = async (d: DireccionDto) => {
        if (!window.confirm("¿Desactivar esta dirección?")) return;
        try {
            await apiClient.delete(`/direcciones/${d.id}`);
            reload();
        } catch (err) {
            window.alert(getErrorMessage(err));
        }
    };

    const columns: Column<DireccionDto>[] = [
        { key: "linea1", label: "Dirección", render: (d) => `${d.linea1}${d.linea2 ? ", " + d.linea2 : ""}` },
        { key: "ciudad", label: "Ciudad" },
        { key: "departamento", label: "Departamento" },
        { key: "codigoPostal", label: "C.P." },
        { key: "esPrincipal", label: "Principal", render: (d) => (d.esPrincipal ? "Sí" : "No") },
        {
            key: "acciones",
            label: "",
            render: (d) => (
                <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => openEdit(d)}>
                        Editar
                    </Button>
                    <Button size="small" color="error" onClick={() => remove(d)}>
                        Desactivar
                    </Button>
                </Stack>
            ),
        },
    ];

    const initialValues: DireccionValues = editing
        ? {
              linea1: editing.linea1,
              linea2: editing.linea2 ?? "",
              ciudad: editing.ciudad,
              departamento: editing.departamento,
              codigoPostal: editing.codigoPostal,
              referencia: editing.referencia ?? "",
              esPrincipal: editing.esPrincipal,
          }
        : emptyValues;

    return (
        <Box>
            <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Direcciones
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                    Nueva dirección
                </Button>
            </Stack>

            <SimpleTable rows={data ?? []} columns={columns} loading={loading} error={error} rowKey={(d) => d.id} />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <Formik<DireccionValues>
                    key={formKey}
                    initialValues={initialValues}
                    validationSchema={direccionSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(undefined);
                        try {
                            if (editing) {
                                await apiClient.put(`/direcciones/${editing.id}`, toRequest(values));
                            } else {
                                await apiClient.post("/direcciones", toRequest(values));
                            }
                            setOpen(false);
                            reload();
                        } catch (err) {
                            setStatus(getErrorMessage(err));
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ handleSubmit, isSubmitting, status, values, handleChange }) => (
                        <Box component="form" onSubmit={handleSubmit}>
                            <DialogTitle>{editing ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
                            <DialogContent>
                                {status ? <Typography color="error">{status}</Typography> : null}
                                <FormikTextField name="linea1" fullWidth label="Línea 1" margin="dense" />
                                <FormikTextField name="linea2" fullWidth label="Línea 2" margin="dense" />
                                <FormikTextField name="ciudad" fullWidth label="Ciudad" margin="dense" />
                                <FormikTextField name="departamento" fullWidth label="Departamento" margin="dense" />
                                <FormikTextField name="codigoPostal" fullWidth label="Código postal" margin="dense" />
                                <FormikTextField name="referencia" fullWidth label="Referencia" margin="dense" />
                                <FormControlLabel
                                    control={<Checkbox name="esPrincipal" checked={values.esPrincipal} onChange={handleChange} />}
                                    label="Dirección principal"
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting}>
                                    {isSubmitting ? "Guardando…" : "Guardar"}
                                </Button>
                            </DialogActions>
                        </Box>
                    )}
                </Formik>
            </Dialog>
        </Box>
    );
}
