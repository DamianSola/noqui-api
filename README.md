
# 📚 Holos API - Documentación Completa

## 📖 Descripción

Backend profesional para Holos, una API RESTful construida con TypeScript, Express y Prisma para gestión de negocios.

---

## 📋 Requisitos Previos

| Requisito | Versión |
|-----------|---------|
| Node.js | v20+ |
| PostgreSQL | v14+ |
| npm o yarn | Última versión |

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd holos-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz (ver sección [Variables de Entorno](#-variables-de-entorno))

### 4. Ejecutar migraciones de Prisma
```bash
npm run prisma:migrate
```

### 5. Generar cliente de Prisma
```bash
npm run prisma:generate
```

### 6. (Opcional) Seedear datos iniciales
```bash
npm run prisma:seed
```

---

## ▶️ Ejecución del Proyecto

| Modo | Comando | Descripción |
|------|---------|-------------|
| Desarrollo | `npm run dev` | Con hot-reload y transpilación en tiempo real |
| Producción | `npm run build && npm run start` | Compila y ejecuta el build |
| Tests | `npm run test` | Ejecuta los tests |
| Tests watch | `npm run test:watch` | Ejecuta tests en modo observación |

### Comandos útiles de Prisma

| Comando | Descripción |
|---------|-------------|
| `npm run prisma:studio` | Abre Prisma Studio para ver/editar datos |
| `npm run prisma:reset` | Resetea la base de datos (borra y recrea) |
| `npm run prisma:generate` | Genera el cliente de Prisma |

---

## 🛠️ Tecnologías y Dependencias

### Principales

| Dependencia | Versión | Descripción |
|-------------|---------|-------------|
| Express | ^4.18.2 | Framework web |
| Prisma | ^5.0.0 | ORM para base de datos |
| TypeScript | ^5.0.0 | Tipado estático |
| jsonwebtoken | ^9.0.2 | Autenticación JWT |
| bcrypt | ^5.1.0 | Encriptación de contraseñas |
| zod | ^3.22.4 | Validación de datos |
| cors | ^2.8.5 | Manejo de CORS |
| helmet | ^7.1.0 | Seguridad HTTP |
| morgan | ^1.10.0 | Logging de requests |
| compression | ^1.7.4 | Compresión de respuestas |
| express-rate-limit | ^7.1.5 | Rate limiting |

### Desarrollo

| Dependencia | Versión | Descripción |
|-------------|---------|-------------|
| ts-node-dev | ^2.0.0 | Ejecución con hot-reload |
| jest | ^29.5.0 | Framework de testing |
| supertest | ^6.3.3 | Testing de endpoints |
| @types/* | - | Tipados de TypeScript |

---

## 📁 Estructura del Proyecto (esperada)

```
holos-api/
├── src/
│   ├── controllers/     # Controladores de cada módulo
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Middlewares (auth, validation)
│   ├── types/           # Interfaces y tipos
│   ├── utils/           # Utilidades
│   └── server.ts        # Entry point
├── prisma/
│   ├── schema.prisma    # Modelos de base de datos
│   └── seed.ts          # Datos iniciales
├── dist/                # Build compilado
├── .env                 # Variables de entorno
└── package.json
```

---

## 🔧 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# ==================== SERVER ====================
NODE_ENV=development          # development | production | test
PORT=3001                     # Puerto del servidor
API_PREFIX=/api/v1            # Prefijo para todas las rutas

# ==================== DATABASE ====================
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/holos_db"

# ==================== AUTH (NextAuth) ====================
NEXTAUTH_SECRET="tu_secret_aqui"      # Secreto para NextAuth (mínimo 32 caracteres)
NEXTAUTH_URL="http://localhost:3000"  # URL del frontend

# ==================== JWT ====================
JWT_SECRET="tu_secret_jwt_aqui"       # Secreto para firmar tokens JWT
JWT_EXPIRES_IN=1h                     # Expiración del token (ej: 1h, 7d)
JWT_REFRESH_EXPIRES_IN=7d             # Expiración del refresh token

# ==================== CORS ====================
FRONTEND_URL="http://localhost:3000"  # URL permitida para CORS
```

### 📋 Descripción de variables

| Variable | Tipo | Requerido | Default | Descripción |
|----------|------|-----------|---------|-------------|
| `NODE_ENV` | string | ✅ | development | Entorno de ejecución |
| `PORT` | number | ❌ | 3001 | Puerto del servidor |
| `API_PREFIX` | string | ❌ | /api/v1 | Prefijo de rutas API |
| `DATABASE_URL` | string | ✅ | - | URL de conexión PostgreSQL |
| `NEXTAUTH_SECRET` | string | ✅ | - | Secreto para NextAuth |
| `NEXTAUTH_URL` | string | ✅ | - | URL del frontend |
| `JWT_SECRET` | string | ✅ | - | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | string | ❌ | 1h | Duración del token JWT |
| `JWT_REFRESH_EXPIRES_IN` | string | ❌ | 7d | Duración del refresh token |
| `FRONTEND_URL` | string | ✅ | - | URL permitida para CORS |

### ⚠️ Notas de seguridad

- No committear el archivo `.env` (agregar a `.gitignore`)
- Usar valores diferentes para cada entorno (dev, staging, prod)
- Las secret keys deben ser largas y aleatorias (mínimo 32 caracteres)

---

## 🔐 Autenticación

Todas las rutas protegidas requieren el siguiente header:

```http
Authorization: Bearer <jwt_token>
```

**Nota:** Solo las rutas de `/auth` (register, login) son públicas.

---

## 📤 Formato de Respuesta Estándar

### ✅ Éxito
```json
{
  "success": true,
  "data": {},
  "message": "Mensaje opcional",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### ❌ Error
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descripción del error",
  "statusCode": 400
}
```

---

## 🔢 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error en la petición |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 📋 Parámetros de Consulta Comunes

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página para paginación |
| `limit` | number | 10 | Cantidad de items por página |
| `search` | string | - | Búsqueda por texto |
| `businessId` | number | - | Filtrar por ID de negocio |

---

## 🗺️ Rutas de la API

### 🔐 Auth Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ | Registrar nuevo usuario |
| POST | `/auth/login` | ❌ | Iniciar sesión |
| POST | `/auth/logout` | ✅ | Cerrar sesión |
| GET | `/auth/me` | ✅ | Obtener usuario actual |

### 🏢 Business Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/business` | ✅ | Obtener todos los negocios |
| POST | `/business` | ✅ | Crear un nuevo negocio |
| GET | `/business/:id` | ✅ | Obtener negocio por ID |
| GET | `/business/owner/:ownerId` | ✅ | Obtener negocios por propietario |
| PUT | `/business/:id` | ✅ | Actualizar negocio |
| DELETE | `/business/:id` | ✅ | Eliminar negocio |
| POST | `/business/:id/guests` | ✅ | Agregar invitado al negocio |
| DELETE | `/business/:id/guests` | ✅ | Remover invitado del negocio |

### 👥 Customers Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/customers` | ✅ | Listar clientes |
| GET | `/customers/owner/:ownerId` | ✅ | Listar clientes por propietario |
| GET | `/customers/:id` | ✅ | Obtener cliente por ID |
| POST | `/customers` | ✅ | Crear nuevo cliente |
| PUT | `/customers/:id` | ✅ | Actualizar cliente |
| DELETE | `/customers/:id` | ✅ | Eliminar cliente |

### 📦 Products Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/products` | ✅ | Listar productos |
| POST | `/products` | ✅ | Crear nuevo producto |
| GET | `/products/:id` | ✅ | Obtener producto por ID |
| PUT | `/products/:id` | ✅ | Actualizar producto |
| DELETE | `/products/:id` | ✅ | Eliminar producto |

### 📊 Inventory Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/inventory` | ✅ | Listar inventario |
| GET | `/inventory/:id` | ✅ | Obtener item de inventario por ID |
| PATCH | `/inventory/:id` | ✅ | Actualizar item de inventario (parcial) |

### 🔄 Stock Movements Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/stock-movements` | ✅ | Listar movimientos de stock |

### 🛒 Orders Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/orders` | ✅ | Listar pedidos |
| POST | `/orders` | ✅ | Crear nuevo pedido |
| GET | `/orders/:id` | ✅ | Obtener pedido por ID |
| PATCH | `/orders/:id/status` | ✅ | Actualizar estado del pedido |

### 💳 Payments Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| POST | `/payments` | ✅ | Crear nuevo pago |
| GET | `/payments/by-order/:orderId` | ✅ | Obtener pagos por ID de pedido |

### 📝 Expenses Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/expenses` | ✅ | Listar gastos |
| POST | `/expenses` | ✅ | Crear nuevo gasto |
| GET | `/expenses/:id` | ✅ | Obtener gasto por ID |
| PUT | `/expenses/:id` | ✅ | Actualizar gasto |
| DELETE | `/expenses/:id` | ✅ | Eliminar gasto |

### 🏭 Suppliers Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/suppliers` | ✅ | Listar proveedores |
| POST | `/suppliers` | ✅ | Crear nuevo proveedor |
| GET | `/suppliers/:id` | ✅ | Obtener proveedor por ID |
| PUT | `/suppliers/:id` | ✅ | Actualizar proveedor |
| DELETE | `/suppliers/:id` | ✅ | Eliminar proveedor |

### 📦 Supply Orders Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/supply-orders` | ✅ | Listar órdenes de compra |
| POST | `/supply-orders` | ✅ | Crear nueva orden de compra |
| GET | `/supply-orders/:id` | ✅ | Obtener orden de compra por ID |
| PATCH | `/supply-orders/:id/status` | ✅ | Actualizar estado de orden de compra |

### 🏷️ Tags Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/tags` | ✅ | Listar etiquetas |
| POST | `/tags` | ✅ | Crear nueva etiqueta |
| POST | `/tags/:tagId/products` | ✅ | Asignar producto a etiqueta |
| DELETE | `/tags/:tagId/products/:productId` | ✅ | Desasignar producto de etiqueta |

### 📅 Calendar Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/calendar` | ✅ | Listar eventos del calendario |
| POST | `/calendar` | ✅ | Crear nuevo evento |
| PUT | `/calendar/:id` | ✅ | Actualizar evento |
| DELETE | `/calendar/:id` | ✅ | Eliminar evento |

### 🔔 Notifications Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/notifications` | ✅ | Listar mis notificaciones |
| POST | `/notifications` | ✅ | Crear notificación para usuario |
| PATCH | `/notifications/:id/read` | ✅ | Marcar notificación como leída |

### 📈 Reports Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/reports` | ✅ | Listar reportes |
| POST | `/reports` | ✅ | Crear nuevo reporte |
| GET | `/reports/:id` | ✅ | Obtener reporte por ID |

### 📜 Audit Logs Routes
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/audit-logs` | ✅ | Listar logs de auditoría |

---

## 📊 Resumen de Rutas

| Módulo | Cantidad |
|--------|----------|
| Auth | 4 |
| Business | 8 |
| Customers | 6 |
| Products | 5 |
| Inventory | 3 |
| Stock Movements | 1 |
| Orders | 4 |
| Payments | 2 |
| Expenses | 5 |
| Suppliers | 5 |
| Supply Orders | 4 |
| Tags | 4 |
| Calendar | 4 |
| Notifications | 3 |
| Reports | 3 |
| Audit Logs | 1 |
| **TOTAL** | **62** |

---

## 📝 Autor y Licencia

| Item | Información |
|------|-------------|
| Autor | Damián Solá |
| Licencia | MIT |
```

---

Este es el README completo en formato markdown. Solo copia y pega este contenido en tu archivo `README.md`. ¿Necesitas que modifique algo más?