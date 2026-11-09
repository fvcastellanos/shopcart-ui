import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useAuthStore } from "../storage/AppState";
import { House } from "@mui/icons-material";
import { hasRol, ROL } from "../client/roles";

const NAV_ITEMS = [
    { label: "Inicio", path: "/", icon: <House />, roles: [ROL.ADMINISTRADOR, ROL.OPERADOR, ROL.CLIENTE] },
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon />, roles: [ROL.ADMINISTRADOR] },
    { label: "Catálogo", path: "/catalogo", icon: <CategoryIcon />, roles: [ROL.ADMINISTRADOR] },
    { label: "Inventario", path: "/inventario", icon: <InventoryIcon />, roles: [ROL.ADMINISTRADOR, ROL.OPERADOR] },
    { label: "Carrito", path: "/carrito", icon: <ShoppingCartIcon />, roles: [ROL.ADMINISTRADOR, ROL.CLIENTE] },
    { label: "Pedidos", path: "/pedidos", icon: <ReceiptLongIcon />, roles: [ROL.ADMINISTRADOR, ROL.CLIENTE, ROL.OPERADOR] },
    { label: "Cupones", path: "/cupones", icon: <LocalOfferIcon />, roles: [ROL.ADMINISTRADOR] },
    { label: "Direcciones", path: "/direcciones", icon: <LocationOnIcon />, roles: [ROL.ADMINISTRADOR, ROL.CLIENTE] },
    { label: "Bitácora", path: "/bitacora", icon: <HistoryIcon />, roles: [ROL.ADMINISTRADOR] },
];


interface AppLayoutProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export default function AppLayout({ darkMode, onToggleDarkMode }: AppLayoutProps) {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();

    const drawerContent = (
        <Box sx={{ width: 240 }} role="presentation">
            <Toolbar>
                <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                    🛒 ShopCart
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {NAV_ITEMS.filter(item => hasRol(user?.rol, item.roles)).map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(true)}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        ShopCart
                    </Typography>
                    <IconButton color="inherit" onClick={onToggleDarkMode}>
                        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <Tooltip title="Cuenta">
                        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                            <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>{initials}</Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem disabled>{user?.email}</MenuItem>
                        {user?.name ? <MenuItem disabled>{user.name}</MenuItem> : null}
                        {user?.rol ? <MenuItem disabled>Rol: {user.rol}</MenuItem> : null}
                        <Divider />
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                logout();
                                navigate("/");
                            }}
                        >
                            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                            Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                open
                sx={{
                    display: { xs: "none", sm: "block" },
                    width: 240,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" },
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: 240 } }}
            >
                {drawerContent}
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: "calc(100% - 240px)" } }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}