import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import CategoriasTab from "./catalogo/CategoriasTab";
import ProductosTab from "./catalogo/ProductosTab";
import VariantesTab from "./catalogo/VariantesTab";
import AtributosTab from "./catalogo/AtributosTab";

export default function Catalogo() {
    const [tab, setTab] = useState(0);

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                Catálogo
            </Typography>
            <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ mb: 2 }}>
                <Tab label="Categorías" />
                <Tab label="Productos" />
                <Tab label="Variantes" />
                <Tab label="Atributos" />
            </Tabs>
            {tab === 0 ? (
                <CategoriasTab />
            ) : tab === 1 ? (
                <ProductosTab />
            ) : tab === 2 ? (
                <VariantesTab />
            ) : (
                <AtributosTab />
            )}
        </Box>
    );
}
