import * as yup from "yup";

/**
 * Número opcional: acepta un campo de texto vacío ("" se convierte a undefined)
 * y valida que, si hay valor, sea numérico.
 */
export const optionalNumber = yup
    .number()
    .typeError("Debe ser un número")
    .nullable()
    .transform((value, original) => (original === "" ? undefined : value));
