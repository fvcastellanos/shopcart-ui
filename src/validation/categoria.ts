import * as yup from "yup";

export const categoriaSchema = yup.object({
    nombre: yup.string().required("Requerido"),
});
