import { Box, Typography } from "@mui/material";
import { useAuthStore } from "../storage/AppState";

export default function Home() {

    const user = useAuthStore((state) => state.user)

    return (
        <Box>
            <Typography variant="h5" sx={{  mb: 3 , fontWeight: 700 }}>
                ¡Bienvenido!
            </Typography>
            <Typography variant="subtitle1" sx={{  mb: 3 , fontWeight: 700 }}>
                {user?.name}
            </Typography>
        </Box>

    );
}