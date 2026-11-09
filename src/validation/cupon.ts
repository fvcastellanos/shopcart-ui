import * as yup from "yup";
import { optionalNumber } from "./helpers";

export const cuponSchema = yup.object({
    codigo: yup.string().required("Requerido"),
    tipo: yup.string().required("Requerido"),
    valor: yup
        .number()
        .typeError("Debe ser un número")
        .positive("Debe ser mayor a 0")
        .required("Requerido"),
    montoMinimo: yup
        .number()
        .typeError("Debe ser un número")
        .min(0, "No puede ser negativo")
        .required("Requerido"),
    fechaInicio: yup.string().required("Requerida"),
    fechaFin: yup
        .string()
        .required("Requerida")
        .test("posterior", "Debe ser posterior al inicio", function (fin) {
            const { fechaInicio } = this.parent;
            return !fechaInicio || !fin || fin > fechaInicio;
        }),
    limiteTotalUsos: optionalNumber.integer("Debe ser entero").min(1, "Mínimo 1"),
    limiteUsoPorCliente: optionalNumber.integer("Debe ser entero").min(1, "Mínimo 1"),
});
