# ShopCart UI

Frontend de **ShopCart**, plataforma web de ventas (reto Tech Challenge 360).
SPA construida con **React + TypeScript + Vite** que consume la
[ShopCart API](../shopcart-api) (REST, base `/v1`).

Implementa la interfaz de los módulos **RF-01 a RF-09**: autenticación, catálogo,
inventario, carrito, cupones, checkout, pedidos, dashboard y bitácora, con control
de acceso por rol.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript (modo strict) |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| UI | Material UI (MUI) v9 + Emotion + Roboto (`@fontsource`) |
| Routing | `react-router` v8 |
| Estado | Zustand (con persistencia en `localStorage`) |
| Formularios | Formik + Yup |
| HTTP | `fetch` con cliente tipado propio (`src/client/ApiClient.ts`) |

---

## Requisitos previos

- Node.js **26** (ver `volta` en `package.json`).
- La [ShopCart API](../shopcart-api) corriendo en `http://localhost:4000`.
  En desarrollo, `vite.config.ts` hace proxy de `/v1` hacia ese servidor.

---

## Instalación y ejecución

```bash
npm install         # 1. Dependencias

npm run dev         # 2. Desarrollo (http://localhost:5173) — requiere el backend arriba
npm run build       # 3. Compila (tsc -b && vite build) → dist/
npm run preview     #    Sirve el build de dist/
npm run typecheck   #    Verifica tipos (tsc --noEmit)
```

> La URL base de la API es `/v1`. En desarrollo, `vite.config.ts` define
> `server.proxy['/v1'] → http://localhost:4000`.

---

## Estructura del proyecto

```
shopcart-ui/
├── index.html
├── vite.config.ts             # plugin react + proxy /v1
└── src/
    ├── main.tsx               # Bootstrap + BrowserRouter
    ├── App.tsx                # Tema MUI, login/logout y rutas protegidas
    ├── client/
    │   ├── ApiClient.ts       # Cliente HTTP tipado (refresh token automático)
    │   ├── jwt.ts             # Decodificación de claims del JWT
    │   ├── roles.ts           # Helpers de rol (isAdmin/isStaff/hasRol)
    │   ├── format.ts          # Formatos (moneda Q, fechas, números)
    │   └── model/ApiModel.ts  # DTOs y tipos de la API
    ├── components/            # AppLayout, SimpleTable, FormikTextField, RequireRole
    ├── hooks/                 # useFetch (loading / error / reload)
    ├── storage/               # AppState (store de autenticación con Zustand)
    ├── validation/            # Esquemas Yup por recurso
    └── views/                 # Pantallas por módulo (+ auth/, catalogo/)
```

---

## Autenticación y roles

El acceso usa **JWT**: el `accessToken` se guarda en memoria/`localStorage` y el
`refreshToken` viaja en una cookie `httpOnly` gestionada por el backend (con fallback
en memoria). El store de Zustand (`src/storage/AppState.ts`) persiste la sesión y
mantiene sincronizado el token del `ApiClient`; ante un `401`, el cliente renueva el
token automáticamente (*single-flight*) y reintenta la petición.

| Rol | Acceso |
|---|---|
| `Cliente` | Compra y consulta su propia información (carrito, pedidos, direcciones) |
| `Operador` | Gestiona pedidos e inventario |
| `Administrador` | Gestiona además catálogo, atributos, cupones, reportes y bitácora |

La navegación y las rutas están protegidas por rol (`src/components/RequireRole.tsx`
y el filtro del menú en `AppLayout`), con comparación insensible a mayúsculas y
acentos (`hasRol` en `client/roles.ts`).

---

## Módulos / vistas

| Vista | Ruta | Cliente | Operador | Administrador |
|---|---|---|---|---|
| Inicio | `/` | ✅ | ✅ | ✅ |
| Dashboard | `/dashboard` | | | ✅ |
| Catálogo (Categorías, Productos, Variantes, Atributos) | `/catalogo` | | | ✅ |
| Inventario | `/inventario` | | ✅ | ✅ |
| Carrito | `/carrito` | ✅ | | ✅ |
| Pedidos | `/pedidos` | ✅ | ✅ | ✅ |
| Cupones | `/cupones` | | | ✅ |
| Direcciones | `/direcciones` | ✅ | | ✅ |
| Bitácora | `/bitacora` | | | ✅ |

- **Catálogo** (`/catalogo`): CRUD de categorías, productos (búsqueda, filtros por
  categoría/precio/disponibilidad, orden y paginación), variantes y atributos,
  incluyendo la asociación de atributos a variantes.
- **Pedidos** (`/pedidos`): el staff ve todos los pedidos (filtros por estado/fecha)
  y el cliente ve los suyos; detalle con historial de estados, cambio de estado
  (staff), cancelación (cliente, solo `Confirmado`/`EnPreparacion`) y devoluciones
  (cliente, solo `Entregado`).
- **Dashboard** (`/dashboard`): total de ventas, pedidos, ticket promedio, ventas por
  periodo y top de productos más vendidos (filtros por rango de fechas).
- **Inventario** (`/inventario`): existencias por variante, kardex y entradas/ajustes.

---

## Cliente HTTP (`src/client/ApiClient.ts`)

- Métodos tipados `get/post/put/patch/delete` contra `/v1`.
- Añade `Authorization: Bearer <token>` y `credentials: include` automáticamente.
- Renovación automática del token al recibir `401` (con deduplicación *single-flight*)
  y reintento de la petición original.
- Normaliza errores en `ApiError` (status + código + mensaje) y expone `getErrorMessage`.

---

## Datos de prueba (seed del backend)

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@shopcart.com` | `Admin123!` | Administrador |
| `operador@shopcart.com` | `Operador123!` | Operador |
| `cliente@shopcart.com` | `Cliente123!` | Cliente |
| `maria@shopcart.com` | `Maria123!` | Cliente |

---

## Decisiones técnicas

- **Material UI v9 + Emotion**, con tema claro/oscuro conmutable.
- **Zustand** para el estado de autenticación (persistido), sin `Context` global.
- **Formik + Yup** para formularios y validación declarativa por recurso.
- **Componentes reutilizables**: `SimpleTable`, `FormikTextField` y `RequireRole`.
- **Hook `useFetch`** para centralizar los estados de carga/error/recarga.
- **Moneda**: montos en quetzales (`formatMoney` → `Q`); precios con IVA incluido.
- **Separación por capas**: `views` → `client` → `storage` → `validation`.
