import * as yup from "yup";

export const direccionSchema = yup.object({
    linea1: yup.string().required("Requerido"),
    linea2: yup.string(),
    ciudad: yup.string().required("Requerido"),
    departamento: yup.string().required("Requerido"),
    codigoPostal: yup.string().required("Requerido"),
    referencia: yup.string(),
    esPrincipal: yup.boolean(),
});
