import * as yup from "yup";

export const varianteSchema = yup.object({
    sku: yup.string().required("Requerido"),
    precio: yup
        .number()
        .typeError("Debe ser un número")
        .positive("Debe ser mayor a 0")
        .required("Requerido"),
    existencia: yup
        .number()
        .typeError("Debe ser un número")
        .integer("Debe ser entero")
        .min(0, "No puede ser negativo")
        .required("Requerido"),
    activo: yup.boolean(),
});

export const varianteUpdateSchema = yup.object({
    precio: yup
        .number()
        .typeError("Debe ser un número")
        .positive("Debe ser mayor a 0")
        .required("Requerido"),
    existencia: yup
        .number()
        .typeError("Debe ser un número")
        .integer("Debe ser entero")
        .min(0, "No puede ser negativo")
        .required("Requerido"),
    activo: yup.boolean(),
});
