# Arquitectura del Sistema - Impressio

## 1. Visión general

### 1.1 Objetivo del sistema
Impressio es una plataforma SaaS empresarial diseñada para digitalizar, automatizar y optimizar el ciclo de vida completo de impresión personalizada. Conecta a empresas de impresión (talleres, proveedores) con sus clientes (B2B y B2C) a través de un portal donde se pueden cotizar, presupuestar, producir, facturar y dar seguimiento a pedidos de impresión, todo desde una única plataforma web.

### 1.2 Problemas que resuelve
- **Fragmentación:** Las empresas de impresión operan con hojas de cálculo, WhatsApp y correos para gestionar pedidos, presupuestos e inventarios. Impressio centraliza todo el flujo.
- **Falta de transparencia:** Los clientes no tienen visibilidad en tiempo real sobre el estado de sus pedidos ni el historial de interacciones.
- **Errores manuales:** La cotización manual y la gestión de variantes de producto generan errores de precio, material y técnica de impresión.
- **Ausencia de auditoría:** No hay trazabilidad de quién hizo qué, cuándo y por qué.
- **Escalabilidad limitada:** Los talleres crecen pero sus procesos manuales no escalan.

### 1.3 Público objetivo
| Segmento | Descripción |
|----------|-------------|
| **Talleres de impresión (B2B)** | Empresas que gestionan múltiples clientes y pedidos. Usan Impressio como sistema de gestión operativo. |
| **Empresas de merchandising (B2B)** | Organizaciones que personalizan productos para clientes finales (camisetas, souvenirs, uniforms). |
| **Clientes finales (B2C)** | Personas que desean imprimir productos personalizados (regalos, papelería, ropa). |
| **Administradores de plataforma** | Supervisan el sistema, configuran parámetros globales y gestionan usuarios y empresas. |

### 1.4 Escalabilidad prevista
- **Usuarios iniciales:** 1–50 empresas en modo SaaS multitenancy por empresa (tenant).
- **Escala media:** 50–500 empresas con miles de pedidos mensuales.
- **Escala alta:** 500+ empresas con millones de registros, requiriendo optimización de índices, read replicas y caching.
- **Despliegue:** Vercel (frontend) + Supabase (PostgreSQL) + potencial escalado a Vercel Edge Functions y Supabase read replicas.

### 1.5 Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                    │
│  Next.js App Router (React Server + Client Components)  │
│  shadcn/ui · Tailwind CSS v4 · TypeScript              │
│  Auth.js v5 · Zustand (state, si es necesario)        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (REST + Server Actions)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes + Server Actions        │
│  Auth.js middleware · Route Handlers · Server Actions   │
│  Zod validation · Prisma Client · Auth.js adapter      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      Prisma v7 ORM                     │
│  Schema-first · Type-safe queries · Migrations         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL (Supabase) · SSL required         │
│  Multitenancy by company_id · RLS a nivel de DB       │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Servicios Externos (futuros)                 │
│  Stripe · Mercado Pago · Google Drive · AWS S3         │
│  OpenAI · Gemini · Claude · DeepSeek · WA Business     │
│  Correos transaccionales · APIs de envío               │
└─────────────────────────────────────────────────────────┘
```

**Patrón:** Monorepo funcional con separación de responsabilidades por capas (Presentation → Application → Domain → Infrastructure). Sin microservicios en Fase 1; modularidad alcanzada mediante carpetas de módulos bien delimitadas y server actions organizadas por dominio.

---

## 2. Principios de diseño

### 2.1 Modularidad
Cada funcionalidad del sistema se encapsula en un módulo independiente con su propia carpeta de `lib/db/`, sus propias Server Actions, sus propios componentes UI y su propia capa de servicios. Los módulos se comunican entre sí a través de interfaces explícitas (funciones, no acceso directo a bases de datos de otro módulo).

### 2.2 Clean Architecture
El sistema sigue el patrón de dependencias hacia adentro:

```
Domain (entidades, interfaces) → Application (casos de uso, server actions) → Infrastructure (Prisma, external APIs) → Presentation (app routes, components)
```

Las entidades no conocen a Prisma ni a Next.js. Los server actions conocen al ORM pero las entidades de dominio definen contratos.

### 2.3 SOLID
- **SRP:** Cada módulo tiene una sola responsabilidad.
- **OCP:** Los módulos extienden comportamiento mediante nuevas variantes (enum de estado, plugins de pago) sin modificar código existente.
- **LSP:** La interfaz de Prisma Client es consistente y polymorphic para todos los módulos.
- **ISP:** Las Server Actions exponen funciones específicas y granularmente definidas.
- **DIP:** Las dependencias de infraestructura (Prisma, Auth.js) se inyectan o se abstraen mediante interfaces de repositorio.

### 2.4 Domain Driven Design (DDD)
- **Bounded Contexts:** Autenticación, Usuarios, Empresas, Productos, Pedidos, Pagos, Facturas, Producción, Inventario, IA — cada uno es un contexto delimitado.
- **Aggregates:** `Order` es el aggregate root que incluye `OrderItem`, `Payment`, `Shipment` e `Invoice`.
- **Domain Events:** `OrderCreated`, `PaymentReceived`, `ShipmentDelivered` — se implementarán como funciones de dominio puros que emiten efectos laterales.
- **Ubiquitous Language:** Todo el equipo usa los mismos términos (pedido ≠ presupuesto, variante ≠ producto, etc.).

### 2.5 Seguridad por diseño
- Authenticated by default: cada operación requiere sesión válida.
- RBAC en cada Server Action y Route Handler.
- Prisma RLS (Row Level Security) configurado en Supabase.
- Sanitización de inputs con Zod en cada punto de entrada.
- Secrets nunca en el repositorio (`.env` local, `.env.example` en git).
- HTTPS obligatorio en producción (Vercel lo garantiza).

### 2.6 Escalabilidad
- **Horizontal:** Stateless serverless functions en Vercel Edge.
- **Vertical:** Supabase auto-scaling con connection pooling.
- **Cache:** Potencial uso de Vercel KV o Redis para cache de reportes.
- **CDN:** Vercel CDN para assets estáticos (imágenes, fuentes, SVGs).
- **Imágenes:** Futuro migración a Supabase Storage / AWS S3 / Google Cloud Storage.

### 2.7 Observabilidad
- Logging estructurado (JSON) con niveles (`info`, `warn`, `error`).
- Audit trail inmutable en tabla `AuditLog`.
- Métricas de negocio en dashboards (ingresos, conversión, tiempos de ciclo).
- Error boundaries en el frontend para capturar fallos de UI.
- Monitoreo de Prisma query performance.

### 2.8 Mantenibilidad
- TypeScript strict mode habilitado.
- Prettier + ESLint configurados y con hooks pre-commit.
- Documentación siempre actualizada junto al código.
- Tests unitarios para utilities y lógica de negocio (fase futura).
- Componentes reutilizables con `cn()` y `cva()`.

---

## 3. Arquitectura de módulos

---

### 3.1 Autenticación (`auth`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar identidad, autenticación y autorización de usuarios |
| **Responsabilidades** | Login, logout, registro, recuperación de contraseña, sesiones JWT, middleware de protección de rutas |
| **Dependencias** | Módulo 2 (Usuarios) |
| **Entidades** | `Session` (Auth.js), `Account` (OAuth), `VerificationToken` |
| **APIs** | Auth.js handlers (`/api/auth/[...nextauth]`), `signIn()`, `signOut()`, `auth()` |
| **Eventos importantes** | `user.logged-in`, `user.logged-out`, `session.expired` |
| **Permisos requeridos** | Todas las rutas protegidas verifican `auth()` |
| **Tecnología** | Auth.js v5 + `@auth/prisma-adapter` |

---

### 3.2 Usuarios (`users`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | CRUD completo de usuarios del sistema |
| **Responsabilidades** | Crear, leer, actualizar usuarios; gestionar perfil; cambiar contraseña; listar usuarios activos/inactivos |
| **Dependencias** | Módulo 1 (Autenticación), Módulo 3 (Roles) |
| **Entidades** | `User` (`id`, `name`, `email`, `passwordHash`, `role`, `image`, `companyId?`) |
| **APIs** | `GET /api/users`, `PUT /api/users/[id]`, `DELETE /api/users/[id]`, `GET /api/users/me` |
| **Eventos importantes** | `user.created`, `user.updated`, `user.deactivated` |
| **Permisos requeridos** | `user:read`, `user:write`, `user:delete` (solo ADMIN) |

---

### 3.3 Roles (`roles`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Definir roles del sistema con descripciones y metadata |
| **Responsabilidades** | Catálogo de roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CLIENT`, `VENDOR`); asignación y descripción |
| **Dependencias** | Ninguna (modelo base) |
| **Entidades** | `Role` (`value`, `label`, `description`), `Permission` (`name`, `resource`, `action`) |
| **APIs** | No rutas públicas; los roles son configuración del sistema |
| **Eventos importantes** | `role.updated` (cambio de permisos) |
| **Permisos requeridos** | `role:manage` (solo SUPER_ADMIN) |

---

### 3.4 Permisos — RBAC (`permissions`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Control de acceso basado en roles con granularidad por recurso y acción |
| **Responsabilidades** | Definir permisos (`order:create`, `invoice:read`, `user:delete`, etc.); asignar permisos a roles; verificar permisos en Server Actions |
| **Dependencias** | Módulo 3 (Roles) |
| **Entidades** | `Permission` (`name`, `resource`, `action`, `description`), `RolePermission` (role ↔ permission) |
| **APIs** | Middleware de permisos en cada Server Action |
| **Eventos importantes** | `permission.granted`, `permission.revoked` |
| **Permisos requeridos** | `permission:manage` (solo SUPER_ADMIN) |

**Implementación:** La función `can(user, resource, action)` se usa al inicio de cada Server Action para garantizar autorización.

---

### 3.5 Empresas (`companies`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar organizaciones que usan Impressio (tenants multitenancy) |
| **Responsabilidades** | CRUD de empresas; gestión de miembros; configuración de empresa (moneda, zona horaria, idioma, impuestos, logo, direcciones fiscales) |
| **Dependencias** | Módulo 2 (Usuarios) |
| **Entidades** | `Company` (`id`, `name`, `slug`, `logo`, `address`, `taxId`, `phone`, `website`, `settings`, `plan`, `createdAt`) |
| **APIs** | `GET/PUT/DELETE /api/companies/[id]`, `GET /api/companies/me`, `POST /api/companies` |
| **Eventos importantes** | `company.created`, `company.updated`, `company.member-added` |
| **Permisos requeridos** | `company:read`, `company:write`, `company:manage` |

**Multitenancy:** Cada tabla del sistema posee un campo `companyId` (FK) que filtra los datos por empresa. RLS en Supabase enforcea que los usuarios solo ven datos de su empresa.

---

### 3.6 Sucursales (`branches`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Modelar sucursales dentro de una empresa para operaciones distribuidas |
| **Responsabilidades** | CRUD de sucursales; cada sucursal tiene dirección, teléfonos y responsable; pedidos y producción pueden vincularse a una sucursal |
| **Dependencias** | Módulo 5 (Empresas) |
| **Entidades** | `Branch` (`id`, `companyId`, `name`, `address`, `phone`, `managerId`, `isActive`) |
| **APIs** | `GET/PUT/DELETE /api/branches/[id]`, `POST /api/branches` |
| **Eventos importantes** | `branch.created`, `branch.updated` |
| **Permisos requeridos** | `branch:read`, `branch:write` |

---

### 3.7 Clientes (`clients`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar la base de datos de clientes (B2B y B2C) |
| **Responsabilidades** | CRUD de clientes; direcciones múltiples; historial de relación; segmentación; notas y tags |
| **Dependencias** | Módulo 5 (Empresas) |
| **Entidades** | `Client` (`id`, `companyId`, `name`, `email`, `phone`, `documentId`, `address`, `type` — `individual`, `company`, `vendor`, `notes`) |
| **APIs** | `GET/PUT/DELETE /api/clients/[id]`, `POST /api/clients`, `GET /api/clients` |
| **Eventos importantes** | `client.created`, `client.updated` |
| **Permisos requeridos** | `client:read`, `client:write` |

---

### 3.8 Direcciones (`addresses`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Abstract addresses used by clients, companies, and shipments |
| **Responsabilidades** | CRUD de direcciones con validación de formato por país; tipos: `billing`, `shipping`, `company`, `branch` |
| **Dependencias** | Módulo 7 (Clientes), Módulo 5 (Empresas), Módulo 8 (Sucursales) |
| **Entidades** | `Address` (`id`, `addressableId`, `addressableType`, `type`, `street`, `city`, `state`, `postalCode`, `country`, `isDefault`) |
| **APIs** | CRUD por dirección asignable |
| **Eventos importantes** | `address.created`, `address.updated` |
| **Permisos requeridos** | `address:read`, `address:write` |

---

### 3.9 Catálogo (`catalog`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Punto de entrada unificado del catálogo de productos de impresión |
| **Responsabilidades** | Listado de productos activos, búsqueda, filtrado por categoría/técnica/material, paginación, ordenamiento |
| **Dependencias** | Módulo 9 (Productos), Módulo 10 (Categorías), Módulo 13 (Técnicas), Módulo 14 (Materiales) |
| **Entidades** | Consultas compuestas sobre `Product`, `Category`, `PrintTechnique`, `Material` |
| **APIs** | `GET /api/catalog`, `GET /api/catalog/[id]`, `GET /api/catalog/search?q=` |
| **Eventos importantes** | No eventos de escritura (solo lectura) |
| **Permisos requeridos** | `catalog:read` (público o autenticado) |

---

### 3.10 Productos (`products`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | CRUD de productos de impresión disponibles |
| **Responsabilidades** | Crear/leer/actualizar/eliminar productos; precio base; imágenes; activación/desactivación; asignación a categoría |
| **Dependencias** | Módulo 10 (Categorías), Módulo 5 (Empresas) |
| **Entidades** | `Product` (`id`, `companyId`, `categoryId`, `name`, `slug`, `description`, `basePrice`, `currency`, `images`, `isActive`, `sortOrder`) |
| **APIs** | `GET/PUT/DELETE /api/products/[id]`, `POST /api/products` |
| **Eventos importantes** | `product.created`, `product.updated`, `product.deactivated` |
| **Permisos requeridos** | `product:read`, `product:write` |

---

### 3.11 Categorías (`categories`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Organizar productos en una jerarquía taxonómica |
| **Responsabilidades** | CRUD de categorías; soporte de subcategorías (árbol); iconos y orden de visualización |
| **Dependencias** | Ninguna (modelo base) |
| **Entidades** | `Category` (`id`, `name`, `slug`, `parentId`, `icon`, `sortOrder`) |
| **APIs** | `GET/PUT/DELETE /api/categories/[id]`, `POST /api/categories` |
| **Eventos importantes** | `category.created`, `category.updated` |
| **Permisos requeridos** | `category:manage` |

---

### 3.12 Variantes (`variants`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Representar cada combinación específica de un producto (talla + color + material + acabado) |
| **Responsabilidades** | Crear variantes con atributos semánticos; SKU único; precio override; control de stock |
| **Dependencias** | Módulo 9 (Productos), Módulo 14 (Materiales), Módulo 13 (Técnicas) |
| **Entidades** | `ProductVariant` (`id`, `productId`, `name`, `sku`, `price`, `attributes`, `isActive`, `sortOrder`) |
| **APIs** | `GET/PUT/DELETE /api/variants/[id]`, `POST /api/products/[id]/variants` |
| **Eventos importantes** | `variant.created`, `variant.price-changed` |
| **Permisos requeridos** | `variant:read`, `variant:write` |

---

### 3.13 Materiales (`materials`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Catálogo de materiales disponibles para impresión (papel, tela, vinyl, etc.) |
| **Responsabilidades** | CRUD de materiales; especificaciones técnicas; materiales compatibles por técnica |
| **Dependencias** | Ninguna (catálogo base) |
| **Entidades** | `Material` (`id`, `name`, `description`, `unit`, `defaultPrice`, `isActive`) |
| **APIs** | `GET/PUT/DELETE /api/materials/[id]`, `POST /api/materials` |
| **Eventos importantes** | `material.created`, `material.deactivated` |
| **Permisos requeridos** | `material:read`, `material:write` |

---

### 3.14 Técnicas de impresión (`print-techniques`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Definir técnicas de impresión disponibles y sus capacidades |
| **Responsabilidades** | CRUD de técnicas; atributos de compatibilidad (materiales, acabados, áreas máximas); reglas de combinación |
| **Dependencias** | Módulo 14 (Materiales) |
| **Entidades** | `PrintTechnique` (`id`, `name`, `slug`, `description`, `maxWidth`, `maxHeight`, `minOrder`, `isActive`) |
| **APIs** | `GET/PUT/DELETE /api/print-techniques/[id]`, `POST /api/print-techniques` |
| **Eventos importantes** | `technique.updated` |
| **Permisos requeridos** | `technique:read`, `technique:write` |

---

### 3.15 Archivos del cliente (`client-files`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestión segura de archivos subidos por clientes (diseños, logos, vectores) |
| **Responsabilidades** | Subida de archivos; validación de tipo y tamaño; almacenamiento en Supabase Storage / S3; generación de thumbnails; enlace a presupuestos y pedidos |
| **Dependencias** | Módulo 6 (Presupuestos), Módulo 7 (Pedidos) |
| **Entidades** | `File` (`id`, `name`, `originalName`, `mimeType`, `size`, `url`, `thumbnailUrl`, `uploadedById`, `uploadedForId`, `uploadedForType`) |
| **APIs** | `POST /api/upload`, `DELETE /api/files/[id]`, `GET /api/files/[id]` |
| **Eventos importantes** | `file.uploaded`, `file.deleted` |
| **Permisos requeridos** | `file:read`, `file:write` |

---

### 3.16 Presupuestos (`budgets`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Crear, enviar y gestionar presupuestos/cotizaciones para clientes |
| **Responsabilidades** | Crear presupuesto con líneas; aplicar descuentos; estado de flujo (borrador → enviado → aceptado/rechazado/expirado); conversión a pedido |
| **Dependencias** | Módulo 4 (Clientes), Módulo 9 (Productos), Módulo 11 (Variantes), Módulo 15 (Archivos) |
| **Entidades** | `Budget` (`id`, `companyId`, `clientId`, `userId`, `slug`, `status`, `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `currency`, `validUntil`, `notes`), `BudgetItem` (`id`, `budgetId`, `variantId`, `quantity`, `unitPrice`, `customization`) |
| **APIs** | `POST /api/budgets`, `GET /api/budgets`, `PUT /api/budgets/[id]`, `POST /api/budgets/[id]/accept` |
| **Eventos importantes** | `budget.created`, `budget.sent`, `budget.accepted`, `budget.rejected`, `budget.expired`, `budget.converted-to-order` |
| **Permisos requeridos** | `budget:read`, `budget:write`, `budget:accept` |

---

### 3.17 Cotizador inteligente con IA (`ai-quoter`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Asistir al cliente en la creación de presupuestos con sugerencias inteligentes |
| **Responsabilidades** | Recomendar productos/variantes según historial; estimar precio automático; sugerir técnicas según material; generar descripciones de producto |
| **Dependencias** | Módulo 9 (Productos), Módulo 11 (Variantes), Módulo 16 (Presupuestos), Módulo 21 (IA) |
| **Entidades** | `AIRecommendation` (`id`, `budgetId`, `type`, `data`, `confidence`) |
| **APIs** | `POST /api/ai/recommend` (productos sugeridos), `POST /api/ai/estimate` (estimación de precio) |
| **Eventos importantes** | `ai.recommendation-generated`, `ai.estimate-computed` |
| **Permisos requeridos** | `ai:read` (autenticado) |

---

### 3.18 Pedidos (`orders`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar pedidos confirmados desde presupuesto aceptado o nuevo pedido directo |
| **Responsabilidades** | Crear/leer/actualizar/liquidar pedidos; líneas de pedido con variante y personalización; seguimiento de estado completo |
| **Dependencias** | Módulo 4 (Clientes), Módulo 11 (Variantes), Módulo 16 (Presupuestos), Módulo 17 (Pagos), Módulo 18 (Facturas), Módulo 19 (Envíos), Módulo 20 (Producción) |
| **Entidades** | `Order` (`id`, `orderNumber`, `companyId`, `clientId`, `userId`, `budgetId?`, `status`, `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `currency`, `shippingAddress`, `notes`), `OrderItem` (`id`, `orderId`, `variantId`, `quantity`, `unitPrice`, `totalPrice`, `customization`) |
| **APIs** | `POST /api/orders`, `GET /api/orders`, `PUT /api/orders/[id]`, `GET /api/orders/[id]/status` |
| **Eventos importantes** | `order.created`, `order.status-changed`, `order.cancelled`, `order.completed` |
| **Permisos requeridos** | `order:read`, `order:write`, `order:cancel` |

---

### 3.19 Producción (`production`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar el flujo de producción de pedidos en el taller |
| **Responsabilidades** | Asignar tareas de producción; registrar avance; control de calidad; alertas de retraso; trazabilidad de lote |
| **Dependencias** | Módulo 18 (Pedidos) |
| **Entidades** | `ProductionOrder` (`id`, `orderId`, `branchId`, `status`, `assignedTo`, `startedAt`, `estimatedEndAt`), `ProductionTask` (`id`, `productionOrderId`, `technique`, `material`, `quantity`, `status`, `notes`), `ProductionLog` (`id`, `taskId`, `action`, `notes`, `operatorId`) |
| **APIs** | `GET/PUT /api/production/[id]`, `POST /api/production/orders`, `POST /api/production/tasks/[id]/advance` |
| **Eventos importantes** | `production.started`, `production.task-completed`, `production.order-ready`, `production.delayed` |
| **Permisos requeridos** | `production:read`, `production:write` |

---

### 3.20 Inventario (`inventory`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Control de stock de materiales y productos terminados |
| **Responsabilidades** | Track de stock por variante/material; movimientos (compra, consumo, ajuste, devolución); alertas de stock mínimo; reposición |
| **Dependencias** | Módulo 9 (Productos), Módulo 14 (Materiales), Módulo 13 (Técnicas), Módulo 23 (Compras) |
| **Entidades** | `Inventory` (`id`, `companyId`, `productVariantId?`, `materialId?`, `quantity`, `reserved`, `available`, `minStock`), `InventoryMovement` (`id`, `inventoryId`, `type`, `quantity`, `referenceType`, `referenceId`, `notes`) |
| **APIs** | `GET /api/inventory`, `POST /api/inventory/movements`, `PUT /api/inventory/[id]` |
| **Eventos importantes** | `inventory.low-stock`, `inventory.movement-created`, `inventory.adjusted` |
| **Permisos requeridos** | `inventory:read`, `inventory:write` |

---

### 3.21 Compras (`purchases`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar órdenes de compra a proveedores para reabastecer inventario |
| **Responsabilidades** | Crear Órdenes de Compra (PO); recibir mercadería; vincular a movimiento de inventario; track de costos |
| **Dependencias** | Módulo 22 (Proveedores), Módulo 20 (Inventario) |
| **Entidades** | `Purchase` (`id`, `companyId`, `supplierId`, `poNumber`, `status`, `subtotal`, `taxAmount`, `totalAmount`, `expectedAt`, `receivedAt`), `PurchaseItem` (`id`, `purchaseId`, `materialId`, `quantity`, `unitCost`, `receivedQty`) |
| **APIs** | `POST /api/purchases`, `GET /api/purchases`, `PUT /api/purchases/[id]/receive` |
| **Eventos importantes** | `purchase.created`, `purchase.received`, `purchase.delayed` |
| **Permisos requeridos** | `purchase:read`, `purchase:write` |

---

### 3.22 Proveedores (`suppliers`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar la base de datos de proveedores de materiales |
| **Responsabilidades** | CRUD de proveedores; materiales que proveen; tiempos de entrega; condiciones de pago; contactos |
| **Dependencias** | Ninguna (catálogo base) |
| **Entidades** | `Supplier` (`id`, `companyId`, `name`, `contactName`, `email`, `phone`, `address`, `paymentTerms`, `isActive`), `SupplierMaterial` (`id`, `supplierId`, `materialId`, `leadTimeDays`, `unitCost`) |
| **APIs** | `GET/PUT/DELETE /api/suppliers/[id]`, `POST /api/suppliers` |
| **Eventos importantes** | `supplier.created`, `supplier.updated` |
| **Permisos requeridos** | `supplier:read`, `supplier:write` |

---

### 3.23 Facturación (`invoices`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Generar y gestionar facturas fiscales vinculadas a pedidos |
| **Responsabilidades** | Crear factura desde pedido pagado; datos fiscales completos; estado de factura; descargable en PDF |
| **Dependencias** | Módulo 18 (Pedidos), Módulo 17 (Pagos), Módulo 4 (Clientes), Módulo 5 (Empresas) |
| **Entidades** | `Invoice` (`id`, `invoiceNumber`, `companyId`, `clientId`, `orderId`, `paymentId?`, `issueDate`, `dueDate`, `status`, `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `currency`, `billingAddress`, `fiscalData`, `notes`) |
| **APIs** | `POST /api/invoices`, `GET /api/invoices`, `GET /api/invoices/[id]/pdf` |
| **Eventos importantes** | `invoice.created`, `invoice.paid`, `invoice.overdue`, `invoice.cancelled` |
| **Permisos requeridos** | `invoice:read`, `invoice:write` |

---

### 3.24 Pagos (`payments`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Registro de transacciones de pago vinculadas a pedidos y facturas |
| **Responsabilidades** | Registrar pagos; múltiples métodos; tracking de transacciones; reembolsos; vinculación con factura |
| **Dependencias** | Módulo 18 (Pedidos), Módulo 23 (Facturación) |
| **Entidades** | `Payment` (`id`, `orderId?`, `invoiceId?`, `clientId`, `companyId`, `method`, `status`, `amount`, `currency`, `transactionId`, `reference`, `paidAt`) |
| **APIs** | `POST /api/payments`, `GET /api/payments`, `POST /api/payments/[id]/refund` |
| **Eventos importantes** | `payment.completed`, `payment.failed`, `payment.refunded` |
| **Permisos requeridos** | `payment:read`, `payment:write` |

---

### 3.25 Envíos (`shipments`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Gestionar el envío físico de pedidos terminados al cliente |
| **Responsabilidades** | Crear envío; asignar carrier; tracking number; actualización de estado; dirección de envío |
| **Dependencias** | Módulo 18 (Pedidos), Módulo 24 (Notificaciones) |
| **Entidades** | `Shipment` (`id`, `orderId`, `companyId`, `carrier`, `trackingNumber`, `carrierUrl`, `status`, `shippedAt`, `deliveredAt`, `shippingAddress`, `notes`) |
| **APIs** | `POST /api/shipments`, `PUT /api/shipments/[id]/track` |
| **Eventos importantes** | `shipment.created`, `shipment.in-transit`, `shipment.delivered`, `shipment.returned` |
| **Permisos requeridos** | `shipment:read`, `shipment:write` |

---

### 3.26 Notificaciones (`notifications`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Sistema de notificaciones internas para usuarios del sistema |
| **Responsabilidades** | Crear notificaciones automáticas por eventos del sistema; marcar como leído/no leído; filtrado por usuario y tipo |
| **Dependencias** | Varios (Pedidos, Pagos, Facturas, Envíos, Producción, IA, Auditoría) |
| **Entidades** | `Notification` (`id`, `userId`, `type`, `title`, `message`, `data`, `read`, `readAt`) |
| **APIs** | `GET /api/notifications`, `PUT /api/notifications/[id]/read`, `GET /api/notifications/unread-count` |
| **Eventos importantes** | `notification.sent`, `notification.read` |
| **Permisos requeridos** | `notification:read`, `notification:write` |

---

### 3.27 Dashboard (`dashboard`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Vista consolidada del negocio para cada rol |
| **Responsabilidades** | KPIs principales; resumen de pedidos pendientes; últimos presupuestos; alertas de stock bajo; actividad reciente |
| **Dependencias** | Todos los módulos de lectura |
| **Entidades** | Datos compuestos de `Order`, `Budget`, `Payment`, `Invoice`, `Shipment`, `Inventory` |
| **APIs** | `GET /api/dashboard`, `GET /api/dashboard/metrics?range=7d|30d|90d` |
| **Eventos importantes** | No eventos |
| **Permisos requeridos** | `dashboard:read` |

---

### 3.28 Reportes (`reports`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Generar reportes analíticos de negocio exportables |
| **Responsabilidades** | Reportes de ingresos, conversión, productos más vendidos, clientes recurrentes, tiempos de ciclo, stock; exportación CSV/PDF |
| **Dependencias** | Todos los módulos de datos |
| **Entidades** | Datos compuestos de todas las tablas transaccionales |
| **APIs** | `GET /api/reports/sales?from=&to=`, `GET /api/reports/products`, `GET /api/reports/clients`, `GET /api/reports/export?format=csv|pdf` |
| **Eventos importantes** | No eventos |
| **Permisos requeridos** | `report:read` |

---

### 3.29 Configuración (`config`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Configuración global y por empresa del sistema |
| **Responsabilidades** | Moneda, zona horaria, idioma, impuestos por defecto, SMTP email, integraciones activas, apariencia del negocio |
| **Dependencias** | Ninguna (módulo raíz) |
| **Entidades** | `SystemConfig` (claves globales), `CompanySetting` (clave-valor por empresa) |
| **APIs** | `GET/PUT /api/settings/company`, `GET/PUT /api/settings/system` |
| **Eventos importantes** | `settings.updated` |
| **Permisos requeridos** | `settings:read`, `settings:write` |

---

### 3.30 Auditoría (`audit`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Registro inmutable de toda acción significativa del sistema |
| **Responsabilidades** | Log de creation/update/delete para cada entidad; IP y user agent del actor; timestamp con timezone; consultas para compliance |
| **Dependencias** | Todos los módulos |
| **Entidades** | `AuditLog` (`id`, `action`, `entityType`, `entityId`, `actorId`, `actorRole`, `metadata`, `ipAddress`, `userAgent`, `createdAt`) |
| **APIs** | `GET /api/audit?entity=Order&from=&to=&actorId=` |
| **Eventos importantes** | `audit.logged` (interno, no expuesto al usuario) |
| **Permisos requeridos** | `audit:read` (solo SUPER_ADMIN) |

---

### 3.31 API pública (`public-api`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Exponer endpoints REST públicos para integraciones externas |
| **Responsabilidades** | Webhooks para pagos, tracking de envíos, verificación de presupuestos públicos por slug, catálogo público de productos |
| **Dependencias** | Módulo 16 (Presupuestos), Módulo 9 (Productos), Módulo 19 (Envíos) |
| **Entidades** | No nuevas entidades; exponen datos existentes con control de acceso |
| **APIs** | `GET /api/public/catalog`, `GET /api/public/budgets/[slug]`, `POST /api/webhooks/stripe` |
| **Eventos importantes** | `webhook.received` |
| **Permisos requeridos** | API key o firma HMAC para webhooks |

---

### 3.32 Integraciones futuras (`integrations`)

| Atributo | Detalle |
|----------|---------|
| **Objetivo** | Preparar la arquitectura para conectarse con servicios externos |
| **Responsabilidades** | Provider abstraction layer; factory patterns para cada integración; configuración por empresa; manejo de errores y retries |
| **Dependencias** | Módulo 29 (Configuración) para almacenar credenciales por empresa |
| **Entidades** | `Integration` (`id`, `companyId`, `provider`, `credentials`, `isActive`, `settings`) |
| **APIs** | `POST /api/integrations/configure`, `GET /api/integrations/status` |
| **Eventos importantes** | `integration.configured`, `integration.error` |
| **Permisos requeridos** | `integration:manage` |

---

## 4. Comunicación entre módulos

### 4.1 Protocolo principal
Todos los módulos se comunican a través de **Server Actions** de Next.js. No existen APIs HTTP internas entre módulos del backend; la comunicación es a nivel de funciones TypeScript.

### 4.2 Flujo de llamadas
```
Presentation (UI)
    ↓ Server Actions
Application Layer (Server Actions)
    ↓ Service calls
Domain Layer (lógica de negocio)
    ↓ Repository pattern
Infrastructure Layer (Prisma Client, external APIs)
```

### 4.3 Eventos del sistema
Los eventos se implementan como funciones que se invocan al completar una acción significativa:

```typescript
// Ejemplo: después de crear un pedido
await createOrder(data);
await emitEvent("order.created", { orderId, clientId, companyId });
// → Dispara: notificación al admin, actualización de inventario, creación de factura pendiente
```

Los eventos forman el puente entre módulos sin acoplamiento directo. Cada módulo que se suscribe a un evento implementa un handler específico.

### 4.4 Patrón de módulos
Cada módulo se estructura así:

```
src/
├── app/api/modules/[module]/route.ts    # Route Handler (webhooks externos, APIs públicas)
├── actions/
│   └── module.actions.ts                # Server Actions específicas del módulo
├── db/
│   └── module.ts                        # Funciones de acceso a datos (queryPrisma)
├── types/
│   └── module.ts                        # Tipos TS de la interfaz del módulo
└── components/
    └── ui/                              # Componentes específicos del módulo
```

### 4.5 Principio de comunicación
- **Módulos base** (Auth, Users, Roles, Permissions, Companies) no dependen de ningún otro módulo de negocio.
- **Módulos de negocio** (Orders, Budgets, Production, etc.) dependen solo de módulos base.
- **Módulos analíticos** (Reports, Dashboard, Audit) dependen de todos los demás módulos pero no son dependidos por nadie.
- **Nunca** un módulo de menor nivel depende de uno de mayor nivel.

---

## 5. Flujo general del negocio

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO DE NEGOCIO COMPLETO                     │
│                                                                   │
│  1. CLIENTE NAVEGA CATÁLOGO                                      │
│     └→ GET /api/catalog → productos activos con variantes        │
│                                                                   │
│  2. CLIENTE CONFIGURA PRODUCTO (selecciona variante + personal.) │
│     └→ POST /api/ai/estimate → IA estima precio                 │
│     └→ POST /api/files/upload → cliente sube diseño/logo        │
│                                                                   │
│  3. CLIENTE SOLICITA PRESUPUESTO                                 │
│     └→ POST /api/budgets → se crea Budget + BudgetItems          │
│     └→ POST /api/notifications → notifica a vendedor            │
│     └→ Email: presupuesto enviado al cliente                     │
│                                                                   │
│  4. VENDEDOR/APROBADOR REVISE PRESUPUESTO                        │
│     └→ GET /api/budgets/[id] → revisión                         │
│     └→ PUT /api/budgets/[id]/accept → presupuesto aceptado      │
│     └→ POST /api/notifications → notifica a cliente             │
│                                                                   │
│  5. CLIENTE CONFIRMA PEDIDO (presupuesto → pedido)              │
│     └→ POST /api/budgets/[id]/convert → se crea Order            │
│     └→ POST /api/inventory/reserve → reserva stock              │
│     └→ POST /api/production/orders → se genera orden prod.      │
│                                                                   │
│  6. CLIENTE REALIZA PAGO                                        │
│     └→ POST /api/payments → registro de pago                    │
│     └→ Webhook Stripe/MercadoPago → POST /api/webhooks/payment  │
│     └→ PUT /api/orders/[id] → status actualizado                │
│                                                                   │
│  7. FACTURACIÓN                                                  │
│     └→ POST /api/invoices → factura emitida (tras pago OK)      │
│     └→ GET /api/invoices/[id]/pdf → descargable                │
│                                                                   │
│  8. PRODUCCIÓN                                                   │
│     └→ POST /api/production/tasks/[id]/advance → avance          │
│     └→ POST /api/notifications → alerta de estado               │
│                                                                   │
│  9. ENVÍO                                                        │
│     └→ POST /api/shipments → se crea envío                       │
│     └→ PUT /api/shipments/[id]/track → actualiza tracking       │
│     └→ Webhook carrier → actualiza estado automáticamente        │
│                                                                   │
│  10. ENTREGA Y CIERRE                                           │
│      └→ PUT /api/orders/[id] → status DELIVERED                 │
│      └→ POST /api/notifications → cliente notificado            │
│      └→ POST /api/audit → evento order.delivered               │
│      └→ POST /api/inventory/consume → consume stock             │
│      └→ Email: confirmación de entrega al cliente               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Arquitectura Frontend

### 6.1 Estructura de carpetas propuesta

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Route group: páginas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── (dashboard)/                  # Route group: dashboard y app principal
│   │   ├── layout.tsx               # Layout con sidebar + header
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── budgets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── production/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   └── page.tsx
│   │   ├── shipments/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── companies/
│   │   │   └── settings/
│   │   ├── ai/
│   │   │   └── chat/
│   │   └── config/
│   │       ├── company/
│   │       └── system/
│   ├── api/                          # API Routes (webhooks, OAuth, externos)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── public/
│   │       ├── catalog/
│   │       │   └── route.ts
│   │       └── budgets/
│   │           └── [slug]/
│   │               └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui components (button, input, card, etc.)
│   ├── forms/                        # Reusable forms (FormField, SearchInput, Select, etc.)
│   ├── layout/                       # Layout components (Sidebar, Header, Footer, Nav)
│   ├── shared/                       # Generic shared components (Modal, Table, Badge, EmptyState)
│   └── features/                     # Feature-specific components organized by module
│       ├── products/
│       ├── budgets/
│       ├── orders/
│       ├── production/
│       └── inventory/
├── features/                         # Feature-based feature units
│   ├── auth/
│   │   ├── auth-form.tsx
│   │   └── session-provider.tsx
│   ├── dashboard/
│   │   └── metrics-grid.tsx
│   ├── catalog/
│   │   ├── product-grid.tsx
│   │   └── product-filter.tsx
│   └── ai/
│       ├── chat-panel.tsx
│       └── recommendation-card.tsx
├── hooks/                            # Custom React hooks
│   ├── use-auth.ts
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-swr.ts
├── lib/                              # Core libraries, utilities, and configurations
│   ├── utils.ts                      # cn() utility
│   ├── prisma.ts                     # Prisma Client singleton
│   ├── auth.ts                       # Auth.js configuration
│   ├── constants.ts                  # App-wide constants
│   ├── date.ts                       # Date formatting utilities
│   ├── currency.ts                   # Currency formatting utilities
│   └── db/                           # Data access layer (per module)
│       ├── users.ts
│       ├── companies.ts
│       ├── products.ts
│       ├── budgets.ts
│       ├── orders.ts
│       ├── payments.ts
│       ├── invoices.ts
│       ├── shipments.ts
│       ├── notifications.ts
│       ├── audit.ts
│       ├── production.ts
│       ├── inventory.ts
│       └── ai.ts
├── types/                            # Shared TypeScript types and Zod schemas
│   ├── z.ts                          # Zod validation schemas
│   ├── models.ts                     # Domain model interfaces
│   ├── api.ts                        # API request/response types
│   └── db.ts                         # Prisma query result types
├── store/                            # Zustand stores (if client state needed beyond React state)
│   ├── sidebar-store.ts
│   ├── notifications-store.ts
│   └── theme-store.ts
├── providers/                        # React context providers
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   └── toast-provider.tsx
├── styles/                           # Global CSS and Tailwind config
│   └── globals.css
├── middleware.ts                     # Next.js middleware (auth + rate limiting)
└── generated/
    └── prisma/                       # Prisma Client (auto-generated, no versionar)
```

### 6.2 Responsabilidades de cada carpeta

| Carpeta | Responsabilidad |
|---------|-----------------|
| **`app/`** | Next.js App Router. Define rutas, layouts, páginas y loading/error boundaries. Contiene también Route Handlers (`api/`) para APIs externas y Server Actions (definidas localmente en cada `page.tsx` o `action.ts`). |
| **`components/`** | Componentes React reutilizables. `ui/` es shadcn/ui (generado). `forms/` son formularios genéricos. `layout/` son componentes estructurales (sidebar, header). `shared/` son componentes transversales (Modal, Table, Badge). `features/` son componentes específicos de cada módulo. |
| **`features/`** | Unidades de funcionalidad que agrupan componentes de un dominio específico. Cada feature es autocontenida con sus componentes, hooks y tipos. Facilita lazy loading y mantenibilidad. |
| **`hooks/`** | Custom React hooks para lógica de estado del cliente: autenticación, debouncing, búsquedas, media queries, SWR (fetching). No contienen lógica de negocio. |
| **`lib/`** | Librerías y utilidades core: `utils.ts` (`cn()`), `prisma.ts` (singleton cliente), `auth.ts` (configuración Auth.js), `constants.ts`, formateadores de fecha/moneda. Además, `db/` contiene las funciones de acceso a datos por módulo. |
| **`types/`** | Definiciones de tipos compartidas: esquemas Zod (`z.ts`), interfaces de modelos de dominio (`models.ts`), tipos de request/response de API (`api.ts`), tipos de resultados de Prisma (`db.ts`). |
| **`store/`** | Zustand stores para estado cliente que persiste entre navegaciones o es compartido entre componentes no relacionados: estado del sidebar, notifications, tema. |
| **`providers/`** | React Context providers que envuelven la aplicación: proveedor de autenticación (envuelve el layout), proveedor de tema (dark/light mode), proveedor de notificaciones (toast). |

---

## 7. Arquitectura Backend

### 7.1 API Routes (Route Handlers)

Los **Route Handlers** son la única vía para solicitudes HTTP externas (webhooks OAuth, webhooks de Stripe/MercadoPago de carriers, APIs públicas). Se ubican en `src/app/api/`.

**Patrón:**
```
src/app/api/
├── auth/[...nextauth]/route.ts   → Auth.js handlers (GET/POST)
├── webhooks/
│   └── stripe/route.ts           → Webhook de Stripe
│   └── mercado-pago/route.ts     → Webhook de MercadoPago
│   └── carrier/route.ts          → Webhook de tracking de envío
├── public/
│   ├── catalog/route.ts          → Catálogo público (sin auth)
│   └── budgets/[slug]/route.ts   → Presupuesto público por slug (sin auth)
└── v1/                           → API versionada (futuro)
    └── companies/[id]/
        └── products/route.ts
```

**Principios:**
- Todos los Route Handlers usan Zod para validar inputs (query params, body, params).
- Se retornan respuestas estandarizadas:
  ```ts
  { success: true; data: T } | { success: false; error: string }
  ```
- Los webhooks verifican firmas HMAC de forma obligatoria.

### 7.2 Server Actions

Las **Server Actions** son la principal interfaz entre el frontend React y el backend. Se definen como funciones `async` con `"use server"` y se invocan desde componentes cliente.

**Patrón:**
```ts
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateBudgetSchema = z.object({
  clientId: z.string().cuid(),
  items: z.array(z.object({
    variantId: z.string().cuid().optional(),
    productName: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    customization: z.record(string).optional(),
  })),
});

export async function createBudget(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const parsed = CreateBudgetSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.message);

  const budget = await prisma.budget.create({
    data: {
      companyId: session.user.companyId!,
      clientId: parsed.data.clientId,
      userId: session.user.id,
      items: { create: parsed.data.items },
      // ... más cálculos
    },
  });

  await emitEvent("budget.created", { budgetId: budget.id, companyId: budget.companyId });
  revalidatePath("/budgets");
  return { success: true, data: budget };
}
```

**Principios:**
- Cada Server Action tiene validación Zod.
- Cada Server Action verifica `auth()` antes de procesar.
- Cada Server Action verifica permisos con `can(user, resource, action)`.
- Se usa `revalidatePath()` después de mutaciones para SSR.
- Se manejan errores con try/catch y mensajes amigables.
- No se expone Prisma raw; las Server Actions llaman a funciones de servicio del módulo correspondiente.

### 7.3 Prisma ORM

**Configuración:**
- **Schema:** `prisma/schema.prisma` — fuente de verdad del modelo de datos.
- **Output:** `src/generated/prisma/` — cliente generado automáticamente.
- **Provider:** `prisma-client-js` con output personalizado.
- **Datasource:** `provider = "postgresql"` (URL vía `DATABASE_URL` env var).
- **Migrations:** `prisma migrate dev` en desarrollo; `prisma migrate deploy` en producción.

**Principios:**
- Nunca se exporta el Prisma Client desde otro módulo directamente; se usa el singleton en `src/lib/prisma.ts`.
- Las queries se organizan en repositorios en `src/lib/db/` por módulo.
- Las transacciones se usan cuando un Server Action toca múltiples tablas.
- Nunca se hace `prisma.$queryRaw` sin sanitización; se usa `prisma.$queryRaw` solo cuando es estrictamente necesario.
- Los nombres de columna en Prisma siguen `camelCase`.

### 7.4 Auth.js (NextAuth v5)

**Configuración:**
```
src/auth.ts → NextAuth() con:
  - adapter: PrismaAdapter(prisma)
  - providers: GitHub, Google, Email
  - session: { strategy: "jwt" }
  - callbacks: session + jwt (para propagar user.id a token)
```

**Rutas:**
```
src/app/api/auth/[...nextauth]/route.ts → exporta GET + POST handlers
```

**Middleware:**
```
src/middleware.ts → verifica auth() y redirige a /login si no autenticado
```

### 7.5 Middleware

El archivo `src/middleware.ts` implementa:

1. **Protección de rutas**: Rutas bajo `(dashboard)/` requieren autenticación. Redirige a `/login` si no hay sesión.
2. **Rate limiting** (básico): Limitar requests por IP usando `@upstash/ratelimit` o similar.
3. **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`.
4. **Localization**: Detectar idioma preferido del usuario para futura i18n.

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  const protectedPaths = ["/dashboard", "/budgets", "/orders", "/production", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### 7.6 Servicios

Los servicios son funciones TypeScript que encapsulan lógica de negocio fuera de las Server Actions. Se ubican en `src/services/` (o inline en `src/lib/db/` para proyectos pequeños).

**Ejemplo de servicio:**
```ts
// src/services/order-service.ts
import { prisma } from "@/lib/prisma";

export const OrderService = {
  async createOrder(data: CreateOrderInput, companyId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: { ...data, companyId } });
      await tx.inventory.updateMany({ /* decrement stock */ });
      await tx.notification.create({ /* notify client */ });
      return order;
    });
  },

  async cancelOrder(orderId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
      await tx.inventory.updateMany({ /* restore stock */ });
      await tx.auditLog.create({ /* log cancellation */ });
    });
  },
};
```

### 7.7 Repositorios

Cada módulo tiene un archivo de repositorio en `src/lib/db/` que abstrae las llamadas a Prisma.

```ts
// src/lib/db/orders.ts
import { prisma } from "@/lib/prisma";

export const OrderRepository = {
  findById(id: string, companyId: string) {
    return prisma.order.findFirst({
      where: { id, companyId },
      include: { items: true, client: true, payments: true },
    });
  },

  findManyByCompany(companyId: string, filters: OrderFilters) {
    return prisma.order.findMany({
      where: { companyId, ...filters },
      orderBy: { createdAt: "desc" },
      include: { client: true },
      pagination: { take: 20 },
    });
  },

  updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  },
};
```

### 7.8 Casos de uso

Los casos de uso orquestan un o más repositorios y servicios para realizar una operación de negocio completa. Se definen en `src/actions/` como Server Actions.

```
CreateBudgetAction
  └→ BudgetRepository.create()
  └→ emit("budget.created")
  └→ revalidatePath("/budgets")
```

---

## 8. Arquitectura de Base de Datos

### 8.1 Organización general

La base de datos usa **PostgreSQL** alojado en **Supabase**. La estructura sigue un patrón de **multitenancy con company_id** en cada tabla transaccional.

### 8.2 Esquemas por dominio

Las tablas se organizan en grupos lógicos (no físicos, ya que PostgreSQL usa schemas por default):

| Dominio | Tablas |
|---------|--------|
| **Auth** | `User`, `Account`, `Session`, `VerificationToken` |
| **Identity** | `User` (extendido), `Role`, `Permission`, `RolePermission` |
| **Tenant** | `Company`, `Branch`, `CompanySetting`, `SystemConfig` |
| **CRM** | `Client`, `ClientAddress`, `Address` |
| **Catalog** | `Category`, `Product`, `ProductVariant`, `PrintTechnique`, `Material`, `CompatibilityRule` |
| **Sales** | `Budget`, `BudgetItem`, `Order`, `OrderItem` |
| **Production** | `ProductionOrder`, `ProductionTask`, `ProductionLog` |
| **Inventory** | `Inventory`, `InventoryMovement` |
| **Purchases** | `Supplier`, `SupplierMaterial`, `Purchase`, `PurchaseItem` |
| **Finance** | `Payment`, `Invoice`, `InvoiceItem` |
| **Shipping** | `Shipment`, `Carrier` |
| **Communication** | `Notification`, `AIChat`, `AIMessage` |
| **Files** | `File` |
| **Governance** | `AuditLog` |
| **Integrations** | `Integration` |

### 8.3 Principios de diseño de DB

1. **Multitenancy:** Cada tabla transaccional tiene `companyId` (FK → Company). RLS en Supabase enforcea que solo ven datos de su empresa.
2. **Soft delete:** No se usan soft deletes en la Fase 1. Se usan `isActive` boolean y enum `status` para marcar eliminaciones lógicas.
3. **Audit fields:** Cada tabla tiene `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
4. **UUID como PK:** Todas las tablas usan `CUID` (`@default(cuid())`) como PK, no auto-increment integer.
5. **Enums como strings:** Los enums Prisma son strings en la DB (no integers).
6. **JSON para datos flexibles:** Campos como `customization`, `shippingAddress`, `attributes` usan `Json` de Prisma para permitir estructuras dinámicas.
7. **Índices:** Se crean índices compuestos en los campos más consultados (`companyId + status`, `companyId + createdAt`, etc.).
8. **Unique constraints:** Slugs son únicos por empresa (`@@unique([companyId, slug])`).

### 8.4 Relaciones principales

```
Company ──1→ N User ──1→ N Order, Budget
Company ──1→ N Client
Company ──1→ N Product ──1→ N ProductVariant
Company ──1→ N Category (self-referencing tree)
Company ──1→ N Branch
Budget  1→ N BudgetItem ──N→ 1 ProductVariant
Order   1→ N OrderItem ──N→ 1 ProductVariant
Order   N→ 1 Payment (1:1)
Order   N→ 1 Invoice (1:1)
Order   N→ 1 Shipment (1:1)
Order   1→ N ProductionOrder ──1→ N ProductionTask ──1→ N ProductionLog
Payment N→ 1 Invoice
Order   N→ N Notification (via event)
User    1→ N Notification, AuditLog, AIChat ──1→ N AIMessage
File    N→ 1 User (uploader)
```

### 8.5 Prisma schema (no implementado)

El `schema.prisma` actual solo tiene el template de `generator client` y `datasource db = "postgresql"`. Los modelos de Auth.js (`User`, `Account`, `Session`, `VerificationToken`) se agregarán cuando se define el schema completo del negocio.

---

## 9. Seguridad

### 9.1 RBAC (Role-Based Access Control)
- Cada usuario tiene un `role` (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CLIENT`, `VENDOR`).
- Cada Server Action y Route Handler verifica:
  1. `auth()` → sesión válida.
  2. `can(user, resource, action)` → tiene el permiso específico.
  3. `companyId` → el recurso pertenece a la empresa del usuario.
- `SUPER_ADMIN` tiene acceso total. `CLIENT` tiene acceso solo a sus propios datos.

### 9.2 Validaciones
- **Zod schemas** en cada Server Action y Route Handler. Validan tipos, rangos, formatos de email, longitud máxima, etc.
- **Sanitización de strings:** Escapar contenido HTML antes de renderizar en el servidor.
- **File upload validation:** Validar MIME type, extensión y tamaño máximo (por ejemplo, 10MB para imágenes, 50MB para PDFs).

### 9.3 Protección CSRF
- Auth.js v5 maneja CSRF internamente con tokens sincronizados (double-submit cookie pattern).
- Todas las mutaciones que requieren autenticación se realizan mediante Server Actions (no fetch público), lo que garantiza el token CSRF de Next.js.
- No se expone ningún endpoint mutante sin protección de autenticación.

### 9.4 Rate Limiting
- **Middleware:** Se implementa rate limiting en `src/middleware.ts` usando `@upstash/ratelimit` o equivalente con Vercel KV.
- **Límites:**
  - `POST /api/auth/signin` → 5 intentos/minuto por IP.
  - `POST /api/upload` → 10 uploads/minuto por usuario.
  - `POST /api/payments/webhook` → sin rate limit (webhooks legítimos).
  - `GET /api/catalog` → 60 requests/minuto por IP (caching en CDN).
- **Respuesta:** Status `429 Too Many Requests` con header `Retry-After`.

### 9.5 Auditoría
- Tabla `AuditLog` inmutable (no UPDATE, solo INSERT).
- Cada acción significativa (create, update, delete, status change, payment, login/logout) genera un registro.
- Campos obligatorios: `action`, `entityType`, `entityId`, `actorId`, `actorRole`, `ipAddress`, `userAgent`, `createdAt`.
- Los logs no pueden ser borrados ni modificados ni por SUPER_ADMIN (solo pueden ser exportados/queries de lectura).

### 9.6 Logs
- **Estructurados JSON:** Todos los logs de servidor son JSON parseable.
- **Niveles:** `info`, `warn`, `error`, `fatal`.
- **Contenido:** timestamp, level, module, action, userId (si existe), requestId, message, metadata.
- **No loguear:** passwords, tokens JWT, datos de tarjetas de crédito, números de documento de identidad.

### 9.7 Protección de archivos
- Los archivos subidos por clientes se almacenan en **Supabase Storage** (o S3 en el futuro) con acceso protegido por firma temporal (presigned URL).
- **Validación de tipo:** Solo se permiten extensiones whitelistadas (PDF, PNG, JPG, SVG, AI, EPS, DXF, ZIP).
- **Validación de tamaño:** Máximo configurable por tipo de archivo (por defecto: imagen 10MB, documento 50MB).
- **Virus scanning:** Futuro integración con ClamAV o servicio similar.
- **Los URLs de storage nunca se exponen directamente al cliente** sin autenticación; se usan presigned URLs con expiry corto (5 minutos).

### 9.8 Gestión de sesiones
- **JWT** como estrategia de sesión (stateless).
- **Duración:** 30 días de sesión sin reautenticación; refresh implícito en cada uso activo.
- **Revocación:** Lista negra de tokens en base de datos (para logout y cambio de contraseña).
- **Dispositivos:** Se muestra la lista de dispositivos activos al usuario en su perfil.

---

## 10. Integraciones futuras

### 10.1 Capa de abstracción
Todas las integraciones externas usan un patrón **provider** con interfaz común:

```ts
// src/lib/integrations/types.ts
export interface IntegrationProvider {
  name: string;
  configure(credentials: Record<string, unknown>): Promise<void>;
  testConnection(): Promise<boolean>;
  disconnect(): Promise<void>;
}

// src/lib/integrations/factory.ts
export const getProvider = (name: string): IntegrationProvider => {
  switch (name) {
    case "stripe": return new StripeProvider();
    case "mercado-pago": return new MercadoPagoProvider();
    case "whatsapp": return new WhatsAppProvider();
    // ...
    default: throw new Error(`Unknown provider: ${name}`);
  }
};
```

### 10.2 Proveedores financieros

| Proveedor | Método | Estado | Responsable |
|-----------|--------|--------|-------------|
| **Stripe** | Tarjeta | Abstraction lista | `src/lib/integrations/stripe/` |
| **Mercado Pago** | Tarjeta, MP wallet | Abstraction lista | `src/lib/integrations/mercado-pago/` |
| **Webhooks** | Confirmación de pago | Route Handler definido | `src/app/api/webhooks/stripe/route.ts` |

### 10.3 Proveedores de IA

| Proveedor | Uso | Estado |
|-----------|-----|--------|
| **OpenAI** | Chat, estimaciones, generación de contenido | Abstraction lista |
| **Gemini** | Alternativa a OpenAI | Abstraction lista |
| **Claude** | Alternativa a OpenAI | Abstraction lista |
| **DeepSeek** | Alternativa económica | Abstraction lista |

Configuración por empresa: cada empresa selecciona su proveedor y modelo en `CompanySetting`.

### 10.4 WhatsApp Business
- **API:** WhatsApp Business Cloud API de Meta.
- **Uso:** Notificaciones de estado de pedido, recordatorios de presupuesto, confirmación de entrega.
- **Configuración:** `Integration` record con `provider = "whatsapp"`, credentials (token, phone number ID).

### 10.5 APIs de envío
- **Carriers:** OCA, DHL, Correo Argentino, UPS (según región).
- **Uso:** Creación automática de envíos, tracking de paquetes.
- **Configuración:** Cada carrier tiene su integración bajo `src/lib/integrations/shipping/`.

### 10.6 Facturación electrónica
- **Proveedor:** Facturación electrónica local (según país: Argentina → ARCA API, Colombia → DIAN, México → SAT).
- **Uso:** Emisión automática de CFDI/Factura Electrónica al confirmar pago.
- **Configuración:** `Integration` record con `provider = "electronic-invoicing"`.

### 10.7 Almacenamiento de archivos
- **Opciones configurables:** Local (Vercel Blob), Supabase Storage, Google Cloud Storage, AWS S3.
- **Selección:** Configuración por empresa en `CompanySetting`.
- **Abstracción:**
  ```ts
  interface StorageProvider {
    upload(file: File, path: string): Promise<{ url: string; thumbnailUrl?: string }>;
    delete(url: string): Promise<void>;
    getPresignedUrl(path: string, expiry: number): Promise<string>;
  }
  ```

---

## 11. Roadmap técnico

### Fase 1 — Infraestructura
- Próximamente completada.
- Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui + Prettier + ESLint.
- Prisma v7 + PostgreSQL (Supabase) configurado.
- Auth.js v5 instalado (sin implementar pantallas de login aún).
- Docs: `docs/` con `vision.md`, `database.md`, `database-setup.md`, `system-architecture.md`.

### Fase 2 — Autenticación
- Implementar pantallas de login/register/reset-password.
- Integrar Auth.js con UI (forms con shadcn/ui).
- Proteger rutas del dashboard con middleware.
- Implementar OAuth flow para Google y GitHub (botones en pantalla de login).
- Pruebas de flujo de auth.

### Fase 3 — Base de datos
- Definir el schema completo de Prisma con todos los modelos.
- Ejecutar `prisma migrate dev --name init`.
- Generar Prisma Client actualizado.
- Seed inicial de datos (roles, permisos, categorías base, materiales, técnicas).

### Fase 4 — Administración
- CRUD de usuarios, roles, permisos.
- CRUD de empresas y sucursales.
- CRUD de proveedores.
- Panel de administración con métricas básicas.
- Gestión de configuración del sistema.

### Fase 5 — Clientes
- CRUD de clientes (B2B y B2C).
- Gestión de direcciones múltiples por cliente.
- Historial de cliente (pedidos anteriores, presupuestos).
- Segmentación básica (nuevo, recurrente, VIP).

### Fase 6 — Productos
- CRUD de categorías (con subcategorías).
- CRUD de productos y variantes.
- Gestión de materiales y técnicas de impresión.
- Upload de imágenes de producto.
- Catálogo público accesible sin login.

### Fase 7 — Pedidos (Presupuestos + Pedidos)
- Cotizador inteligente con IA (estimación de precio).
- Creación de presupuestos con líneas.
- Flujo de estados de presupuesto (draft → sent → accepted → rejected → expired).
- Conversión de presupuesto a pedido.
- Gestión de archivos del cliente (upload de diseños).

### Fase 8 — Producción + Inventario
- Panel de producción con tablero Kanban (pendiente → en proceso → control de calidad → listo).
- Asignación de tareas a operarios.
- Control de inventario (movimientos, stock mínimo, alertas).
- Gestión de compras a proveedores (PO).

### Fase 9 — Facturación + Pagos + Envíos
- Integración con pasarela de pago (Stripe / MercadoPago).
- Facturación electrónica (según país).
- Creación de envíos con tracking.
- Webhooks de confirmación de pago y tracking.

### Fase 10 — IA
- Chat de asistencia al cliente con IA.
- Sugerencias de personalización basadas en historial.
- Generación automática de descripciones de producto.
- Resúmenes de conversaciones con clientes.
- Análisis de sentimiento en presupuestos/pedidos.

### Fase 11 — Integraciones externas
- WhatsApp Business (notificaciones).
- APIs de envío (OCA, DHL, correos).
- Almacenamiento de archivos configurable (S3, Supabase Storage, GCS).
- Google Drive integration (backup de archivos).
- APIs públicas documentadas (OpenAPI/Swagger).

### Fase 12 — Optimización y maduración
- Observabilidad completa (logging, tracing, métricas).
- Rate limiting robusto.
- CDN global (Vercel Edge).
- Tests unitarios e integración.
- CI/CD pipeline (GitHub Actions).
- Multi-idioma (i18n).
- Multi-moneda con conversión.
- Mobile-responsive refinado (PWA opcional).
- Performance optimization (lazy loading, memoization, DB indexes).

---

## 12. Buenas prácticas

### 12.1 Convenciones de nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Carpetas | `kebab-case` | `src/app/admin/users/` |
| Archivos TypeScript | `kebab-case.ts` | `create-budget-action.ts` |
| Archivos React | `kebab-case.tsx` | `budget-form.tsx` |
| Componentes | `PascalCase` | `BudgetForm`, `OrderList` |
| Funciones / Server Actions | `camelCase` | `createBudget`, `updateOrderStatus` |
| Variables / constants | `camelCase` | `maxFileSize`, `defaultTaxRate` |
| Interfaces / tipos | `PascalCase` | `CreateBudgetInput`, `OrderStatus` |
| Zod schemas | PascalCase con `Schema` suffix | `CreateBudgetSchema`, `OrderFiltersSchema` |
| DB tables | `snake_case` plural | `order_items`, `production_logs` |
| DB columns | `snake_case` | `company_id`, `created_at` |
| DB enums | `PascalCase` singular | `OrderStatus`, `PaymentMethod` |
| Env variables | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `NEXTAUTH_SECRET` |
| Permisos | `resource:action` | `order:create`, `invoice:read`, `user:delete` |
| Commit messages | `type(scope): message` en inglés | `feat(orders): add order status tracking` |
| Archivos de documentación | `kebab-case.md` | `docs/system-architecture.md` |

### 12.2 Estructura de carpetas

**Reglas obligatorias:**
- Nunca crear carpetas vacías.
- Cada carpeta debe tener al menos un archivo de índice (`index.ts`) si expone módulos.
- `src/lib/db/` contiene solo funciones de acceso a Prisma (repositories). No contiene lógica de negocio compleja.
- `src/services/` o `src/actions/` contiene las acciones de servidor (Server Actions) organizadas por módulo.
- `src/types/` contiene todos los tipos compartidos y esquemas Zod.
- Las rutas públicas están en `src/app/api/public/` y requieren autenticación en `src/app/api/(authenticated)/` (route group).
- Los componentes específicos de un módulo van en `src/components/features/`, no directamente en `src/components/ui/`.

### 12.3 Convenciones para componentes
- Todos los componentes de UI base usan `cn()` de `@/lib/utils`.
- Todos los componentes que aceptan `className` prop usan `cn()` para mergear clases.
- Los componentes de formulario usan `react-hook-form` + `zod.resolver`.
- Los componentes de datos (tablas, listas) usan `useSWR` o React Query para fetching.
- No se pasan props como `any`. Siempre tipar con `Record<string, unknown>` o interfaces específicas.
- Server Components por defecto; marcar `"use client"` solo cuando se necesite interactividad con `useState`, `useEffect`, event handlers, etc.

### 12.4 Convenciones para Prisma
- **Modelos:** `PascalCase`, primera letra mayúscula.
- **Campos:** `camelCase`.
- **Relaciones:** usar `relation` explícita con `@relation`, no naming conventions implícitas.
- **CUIDs:** todas las PKs usan `@default(cuid())`.
- **Created/Updated:** todas las tablas tienen `createdAt DateTime @default(now())` y `updatedAt DateTime @updatedAt`.
- **Indexes:** se agregan `@@index` explícitos para campos de búsqueda frecuente (`companyId + status`, etc.).
- **Unique bounds:** `@@unique([companyId, slug])` para slugs únicos por empresa.
- **`@map`:** usar para mapear nombres de tabla a PascalCase singular (`@@map("User")`), consistente con el plural en Prisma.
- **Nunca** hacer commit de `src/generated/prisma/` (está en `.gitignore`).

### 12.5 Convenciones para Git
- **Branch:** `main` es la rama de producción. Las features se desarrollan en ramas descriptivas: `feat/orders-shipping`, `fix/inventory-stock`, `docs/system-architecture`.
- **Tamaño de commits:** commits pequeños y atómicos (> 1 cambio lógico por commit).
- **Rebase:** usar rebase interactivo para mantener el histórico limpio antes de merge a `main`.
- **Tags:** versionar releases con Git tags (`v0.1.0`, `v1.0.0-beta`).

### 12.6 Convenciones para commits
Usar **Conventional Commits**:

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feat` | Nueva funcionalidad | `feat(budgets): add budget-to-order conversion` |
| `fix` | Corrección de bug | `fix(payments): handle failed webhook signature` |
| `chore` | Tareas de mantenimiento/CI/setup | `chore: setup Prisma` |
| `docs` | Documentación | `docs: add database architecture` |
| `refactor` | Refactorización sin cambio de comportamiento | `refactor(auth): extract permission check utility` |
| `test` | Añadir/actualizar tests | `test(orders): add unit tests for status transitions` |
| `style` | Formatting (sin cambio de lógica) | `style: fix trailing commas` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow` |
| `perf` | Mejora de rendimiento | `perf(db): add composite index on orders` |

**Formato obligatorio:**
```
<type>(<scope>): <subject>

<body> (opcional, descripción detallada)

<footer> (opcional, referencias a issues, breaking changes)
```

### 12.7 Convenciones para documentación
- Toda nueva funcionalidad requiere actualización de `docs/` correspondiente.
- `docs/system-architecture.md` es el documento maestro — debe actualizarse cuando se agreguen módulos o se rompan dependencias arquitectónicas.
- `docs/database.md` describe la arquitectura DB; `docs/database-setup.md` describe el proceso de setup de Supabase.
- ADRs (Architecture Decision Records) en `docs/adr/` para decisiones arquitectónicas importantes.
- Cada archivo de código debe tener un JSDoc simple que describa su propósito si la responsabilidad no es obvia por el nombre.
- README.md se mantiene actualizado con instrucciones de setup y desarrollo.

---

## 13. Revisión de consistencia

| Aspecto | Verificación |
|---------|-------------|
| **Nombres de módulos** | 18 módulos listados, consistentes con la lista del usuario y 2 adicionales solicitados (`Sucursales` y `Archivos del cliente`). |
| **Dependencias** | Todas las dependencias apuntan a módulos previos en el roadmap. Ningún módulo depende de uno que se implementa después. |
| **Orden de implementación** | Fases 1-12 siguen un orden lógico: infraestructura → auth → DB → admin → CRM → catálogo → ventas → operación → finanzas → IA → integraciones → optimización. |
| **Estructura de carpetas Frontend** | `src/` definido con todas las subcarpetas solicitadas (app, components, features, hooks, lib, services, types, store, providers). Cada una con responsabilidad clara. |
| **Estructura de carpetas Backend** | API Routes + Server Actions + Prisma + Auth.js + Middleware + Servicios + Repositorios + Casos de uso — todos definidos y explicados. |
| **Prisma schema** | Arquitectura definida sin generar el schema aún. No hay modelo creado todavía. |
| **Seguridad** | RBAC, Zod validation, CSRF, Rate limiting, Audit, Logs, File protection, Session management — todos definidos. |
| **Integraciones** | 11 integraciones futuras con patrones de abstracción definidos para cada una. |
| **Roadmap** | 12 fases coherentes cubriendo todas las áreas del sistema. |
| **Buenas prácticas** | Convenciones de nombres, carpetas, componentes, Prisma, Git, commits y documentación definidas para cada una. |
| **Arquitectura consistente** | Multitenancy (companyId everywhere), CUIDs como PK, JSON para datos flexibles, enums como strings, timestamp en UTC, estructura de módulos con boundaries claros. |

---

Este documento es la versión canónica de la arquitectura de Impressio. Toda decisión futura de implementación debe alinearse con los principios, módulos y convenciones definidos aquí.
