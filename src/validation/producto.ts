import * as yup from "yup";

export const productoSchema = yup.object({
    nombre: yup.string().required("Requerido"),
    descripcion: yup.string(),
    idCategoria: yup.string().required("Selecciona una categoría"),
});
