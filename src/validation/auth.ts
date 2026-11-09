import * as yup from "yup";

export const loginSchema = yup.object({
    email: yup.string().email("Correo inválido").required("Requerido"),
    password: yup.string().required("Requerido"),
});

export const registerSchema = yup.object({
    email: yup.string().email("Correo inválido").required("Requerido"),
    password: yup.string().min(8, "Mínimo 8 caracteres").required("Requerido"),
    nombre: yup.string().max(150, "Máximo 150 caracteres").required("Requerido")
});
