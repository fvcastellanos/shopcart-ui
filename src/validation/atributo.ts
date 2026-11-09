import * as yup from "yup";

export const atributoSchema = yup.object({
    nombre: yup.string().required("Requerido").max(50, "Máximo 50 caracteres"),
});
