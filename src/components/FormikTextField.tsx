import { useField } from "formik";
import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

type FormikTextFieldProps = Omit<
    TextFieldProps,
    "name" | "value" | "onChange" | "onBlur" | "error" | "helperText"
> & {
    name: string;
};

/** TextField de MUI conectado a Formik (muestra error/helperText por campo). */
export default function FormikTextField({ name, ...props }: FormikTextFieldProps) {
    const [field, meta] = useField(name);
    return (
        <TextField
            {...field}
            {...props}
            error={meta.touched && Boolean(meta.error)}
            helperText={meta.touched && meta.error ? String(meta.error) : undefined}
        />
    );
}
