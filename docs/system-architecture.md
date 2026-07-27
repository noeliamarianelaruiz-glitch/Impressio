# Arquitectura del Sistema - Impressio

## 1. Visión general

Impressio es una plataforma SaaS full-stack para impresión personalizada, construida con **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Prisma v7** y **PostgreSQL (Supabase)**. El sistema se organiza en **17 módulos independientes** con responsabilidades bien definidas, comunicación a través de interfaces claras y un orden de implementación escalonado.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js App Router (React Server Components + Client Components), TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend / API** | Next.js Route Handlers, Server Actions |
| **Auth** | Auth.js v5 (NextAuth) con Prisma adapter, providers: Google, GitHub, Email |
| **ORM** | Prisma v7 (`@prisma/client`) |
| **Base de datos** | PostgreSQL (Supabase) |
| **Estilos** | Tailwind CSS v4 + PostCSS, class-variance-authority, tailwind-merge |
| **IA** | Integración con LLM para asistencia al cliente y generación de contenido |
| **Despliegue** | Vercel (frontend), Supabase (base de datos) |

---

## 3. Estructura de carpetas

```
impressio/
├── src/
│   ├── app/                    # Next.js App Router (routes, pages, layouts)
│   │   ├── api/                # Route Handlers externos (webhooks, OAuth callbacks)
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── webhooks/
│   │   ├── (auth)/             # Route group para páginas de auth
│   │   ├── (dashboard)/        # Route group para el dashboard principal
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # Componentes base de shadcn/ui
│   │   ├── forms/              # Componentes de formularios reutilizables
│   │   ├── layout/             # Header, Sidebar, Footer
│   │   └── shared/             # Componentes compartidos entre módulos
│   ├── lib/
│   │   ├── utils.ts            # Función `cn` de utilidad
│   │   ├── prisma.ts           # Singleton del Prisma Client
│   │   ├── auth.ts             # Configuración de Auth.js
│   │   └── db/                 # Helpers de acceso a datos por módulo
│   │       ├── users.ts
│   │       ├── companies.ts
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── budgets.ts
│   │       ├── payments.ts
│   │       ├── invoices.ts
│   │       ├── shipments.ts
│   │       ├── notifications.ts
│   │       └── audit.ts
│   ├── generated/prisma/       # Prisma Client generado (no versionar)
│   └── types/                  # Tipos compartidos y Zod schemas
├── prisma/
│   └── schema.prisma           # Esquema de base de datos (fuente de verdad)
├── components.json             # Configuración de shadcn/ui
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
├── .prettierrc
└── .gitignore
```

---

## 4. Arquitectura por módulos

---

### Módulo 1 — Autenticación (`auth`)

**Responsabilidades:**
- Registro e inicio de sesión (OAuth: Google, GitHub; Email/password)
- Gestión de sesiones mediante JWT (Auth.js v5)
- Middleware de protección de rutas
- Manejo de tokens de verificación de correo

**Dependencias:**
- Auth.js v5 + Prisma adapter → Prisma

**Implementación:** `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

---

### Módulo 2 — Usuarios y Roles (`users`)

**Responsabilidades:**
- CRUD de usuarios
- Asignación de roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CLIENT`, `VENDOR`)
- Gestión de perfiles de usuario
- Control de acceso basado en roles (RBAC)

**Dependencias:**
- Módulo 1 (Autenticación)

**Implementación:** `src/lib/db/users.ts`, tabla `User` + `Role`/`Permission` en Prisma schema

---

### Módulo 3 — Empresas (`companies`)

**Responsabilidades:**
- Registro y gestión de empresas (organizaciones B2B)
- Miembros de empresa (asociación User ↔ Company)
- Configuración de empresa (logo, dirección, impuestos, moneda base)
- Planes de suscripción (futuro)

**Dependencias:**
- Módulo 2 (Usuarios y Roles)

**Implementación:** tabla `Company`, `src/lib/db/companies.ts`

---

### Módulo 4 — Clientes (`clients`)

**Responsabilidades:**
- Registro de clientes (personas o empresas)
- Historial de clientes por empresa
- Direcciones de envío y datos de contacto
- Segmentación de clientes

**Dependencias:**
- Módulo 3 (Empresas)

**Implementación:** tabla `Client`, `src/lib/db/clients.ts`

---

### Módulo 5 — Catálogo de Productos (`catalog`)

**Responsabilidades:**
- CRUD de productos de impresión
- Asociación a categorías
- Gestión de imágenes y galería
- Precios base y estado de disponibilidad

**Dependencias:**
- Módulo 3 (Empresas - cada producto pertenece a una empresa)
- Módulo 6 (Técnicas de Impresión - referencia de técnicas)

**Implementación:** tabla `Product`, `src/lib/db/products.ts`

---

### Módulo 6 — Técnicas de Impresión (`print-techniques`)

**Responsabilidades:**
- Definición de técnicas de impresión disponibles (serigrafía, DTF, sublimación, grabado láser, etc.)
- Atributos de cada técnica (materiales compatibles, acabados, limitaciones)
- Reglas de combinación de variante (talla + color + material + técnica)

**Dependencias:**
- Ninguno (modelo base del sistema)

**Implementación:** tablas `PrintTechnique`, `CompatibilityRule`, `src/lib/db/printTechniques.ts`

---

### Módulo 7 — Presupuestos (`budgets`)

**Responsabilidades:**
- Creación de presupuestos por cliente
- Líneas de presupuesto con variante de producto y cantidad
- Personalización del cliente por línea (archivos, notas, acabados)
- Estados del presupuesto (borrador, enviado, aceptado, rechazado, expirado)
- Conversión de presupuesto a pedido

**Dependencias:**
- Módulo 4 (Clientes)
- Módulo 5 (Catálogo de Productos)
- Módulo 10 (Pagos - para vinculación futura)
- Módulo 16 (Reportes - para métricas de conversión)

**Implementación:** tablas `Budget`, `BudgetItem`, `src/lib/db/budgets.ts`

---

### Módulo 8 — Pedidos (`orders`)

**Responsabilidades:**
- Creación de pedidos (a partir de presupuesto aceptado o directo)
- Gestión de líneas de pedido con variantes y personalización
- Estados del pedido (pendiente, confirmado, en producción, impreso, listo, enviado, entregado, cancelado)
- Referencia al cliente, empresa y usuario creador

**Dependencias:**
- Módulo 4 (Clientes)
- Módulo 5 (Catálogo de Productos)
- Módulo 7 (Presupuestos - opcional, origen del pedido)
- Módulo 11 (Pagos - vinculación de pago al pedido)
- Módulo 12 (Facturación - vinculación de factura al pedido)
- Módulo 13 (Envíos)
- Módulo 14 (Notificaciones)

**Implementación:** tablas `Order`, `OrderItem`, `src/lib/db/orders.ts`

---

### Módulo 9 — Producción (`production`)

**Responsabilidades:**
- Flujo de trabajo de producción por pedido
- Asignación de tareas de impresión a operarios/talleres
- Control de calidad por lotes
- Seguimiento de estado de producción en tiempo real
- Alertas de retrasos o errores en producción

**Dependencias:**
- Módulo 8 (Pedidos)

**Implementación:** tablas `ProductionOrder`, `ProductionTask`, `ProductionLog`, `src/lib/db/production.ts`

---

### Módulo 10 — Inventario (`inventory`)

**Responsabilidades:**
- Control de stock por variante de producto
- Movimientos de inventario (entrada, salida, ajuste)
- Umbrales de stock mínimo y alertas de reposición
- Historial de inventario por empresa
- Vinculación con proveedores (futuro)

**Dependencias:**
- Módulo 5 (Catálogo de Productos)
- Módulo 6 (Técnicas de Impresión - materiales)
- Módulo 16 (Reportes - KPIs de inventario)

**Implementación:** tablas `Inventory`, `InventoryMovement`, `src/lib/db/inventory.ts`

---

### Módulo 11 — Pagos (`payments`)

**Responsabilidades:**
- Registro de transacciones de pago por pedido
- Soporte para múltiples métodos (efectivo, transferencia, tarjeta, Stripe, MercadoPago)
- Estados del pago (pendiente, completado, fallido, reembolsado)
- Vinculación con factura

**Dependencias:**
- Módulo 8 (Pedidos)
- Módulo 12 (Facturación)

**Implementación:** tabla `Payment`, `src/lib/db/payments.ts`

---

### Módulo 12 — Facturación (`invoices`)

**Responsabilidades:**
- Generación de facturas a partir de pedidos pagados
- Datos fiscales del emisor y receptor
- Estados de factura (borrador, emitida, pagada, vencida, anulada)
- Descargable en PDF (futuro)
- Cumplimiento fiscal local (IVA/CUIT/RFC/etc.)

**Dependencias:**
- Módulo 8 (Pedidos)
- Módulo 11 (Pagos)
- Módulo 4 (Clientes)
- Módulo 3 (Empresas)

**Implementación:** tabla `Invoice`, `src/lib/db/invoices.ts`

---

### Módulo 13 — Envíos (`shipments`)

**Responsabilidades:**
- Creación de envíos por pedido
- Selección de carrier (Correo, DHL, UPS, OCA, etc.)
- Número de tracking y URL de rastreo
- Estados de envío (pendiente, enviado, en tránsito, entregado, devuelto)
- Dirección de envío específica por pedido

**Dependencias:**
- Módulo 8 (Pedidos)
- Módulo 14 (Notificaciones - notificar al cliente cuando se envía)

**Implementación:** tabla `Shipment`, `src/lib/db/shipments.ts`

---

### Módulo 14 — Notificaciones (`notifications`)

**Responsabilidades:**
- Notificaciones internas a usuarios del sistema (no email por ahora)
- Tipos de notificación: actualización de pedido, pago recibido, presupuesto expirado, alerta de sistema, resumen IA
- Marcado como leído/no leído
- Agrupación y filtrado por usuario

**Dependencias:**
- Módulos 8, 9, 11, 12, 13, 15 (todos los módulos que generan eventos notificables)

**Implementación:** tabla `Notification`, `src/lib/db/notifications.ts`

---

### Módulo 15 — Inteligencia Artificial (`ai`)

**Responsabilidades:**
- Conversaciones con IA para asistencia al cliente (chat)
- Sugerencias de personalización basadas en historial
- Generación automática de descripciones de productos
- Resúmenes de conversaciones y análisis de sentimiento (futuro)
- Contexto por conversación (producto, presupuesto, pedido)

**Dependencias:**
- Módulo 2 (Usuarios)
- Módulo 8 (Pedidos)
- Módulo 7 (Presupuestos)
- Módulo 4 (Clientes)

**Implementación:** tablas `AIChat`, `AIMessage`, `src/lib/db/ai.ts`

---

### Módulo 16 — Administración (`admin`)

**Responsabilidades:**
- Panel de administración global
- Gestión de usuarios, empresas, roles y permisos
- Configuración del sistema (parámetros globales)
- Supervisión de actividad del sistema
- Acceso a todos los datos de todos los clientes

**Dependencias:**
- Todos los módulos

**Implementación:** páginas de administración en `(dashboard)`, `src/lib/db/admin.ts`, combinación de todos los módulos de datos

---

### Módulo 17 — Reportes (`reports`)

**Responsabilidades:**
- Dashboard de métricas del negocio (ingresos, pedidos, conversiones)
- Reportes por empresa, rango de fechas y estado
- Exportación de datos (CSV/PDF)
- KPIs clave: ingresos totales, ticket promedio, tasa de conversión (presupuesto → pedido), productos más vendidos, clientes recurrentes

**Dependencias:**
- Todos los módulos de negocio (8, 9, 10, 11, 12, 13)

**Implementación:** `src/lib/db/reports.ts`, páginas de reportes en `(dashboard)`

---

### Módulo 18 — Configuración (`config`)

**Responsabilidades:**
- Ajustes globales y por empresa (moneda, zona horaria, idioma, impuestos)
- Configuración de email (SMTP para notificaciones por correo)
- Configuración de integraciones (Stripe, MercadoPago, carriers)
- Ajustes de apariencia del negocio (colores, logo del cliente)

**Dependencias:**
- Ninguno (módulo raíz)

**Implementación:** tabla `CompanySetting`, tabla `SystemConfig`, `src/lib/db/config.ts`

---

## 5. Orden recomendado de implementación

```
Fase 0: Infraestructura (completado)
├── Next.js + TypeScript + Tailwind + shadcn/ui
├── Prisma + PostgreSQL (Supabase)
├── Auth.js v5 (Google, GitHub, Email)
└── ESLint + Prettier

Fase 1: Base de datos y Auth
├── Módulo 1  Autenticación
├── Módulo 2  Usuarios y Roles
├── Módulo 18 Configuración
└── Módulo 3  Empresas (básico)

Fase 2: CRM
├── Módulo 4  Clientes
├── Módulo 14 Notificaciones (básico)
└── Módulo 16 Administración (básico)

Fase 3: Catálogo y Ventas
├── Módulo 6  Técnicas de Impresión
├── Módulo 5  Catálogo de Productos
├── Módulo 7  Presupuestos
├── Módulo 8  Pedidos
└── Módulo 11 Pagos

Fase 4: Operaciones
├── Módulo 10 Inventario
├── Módulo 12 Facturación
├── Módulo 9  Producción
├── Módulo 13 Envíos
└── Módulo 14 Notificaciones (completo)

Fase 5: Inteligencia y Analytics
├── Módulo 15 IA
├── Módulo 17 Reportes
└── Módulo 16 Administración (completo)
```

---

## 6. Patrones de comunicación entre módulos

- **Server Actions:** La comunicación principal entre el frontend y la lógica de negocio se realiza mediante Server Actions de Next.js. Cada módulo expone sus Server Actions en archivos dedicados (`src/actions/`).
- **Paso de datos:** Los datos fluyen de módulos superiores (base) hacia módulos de negocio (ventas → reportes). Los módulos de reportes y administración consumen datos de todos los demás módulos sin modificarlos.
- **Events (futuro):** Se prevé implementar un sistema de eventos internos (`onOrderCreated`, `onPaymentReceived`, etc.) para desacoplar módulos como Notificaciones del origen del evento.
- **Zod validation:** Todos los inputs de Server Actions se validan con Zod antes de procesarse, garantizando integridad de datos entre módulos.

---

## 7. Principios arquitectónicos

1. **Separación de responsabilidades:** Cada módulo tiene un dominio claro y no invade el de otro.
2. **Tipado fuerte:** TypeScript en todo el stack; esquemas Zod para validación de inputs.
3. **Seguridad:** Auth.js maneja autenticación; Prisma maneja autorización a nivel de consulta; RLS en Supabase a nivel de base de datos.
4. **Escalabilidad:** Diseño modular permite agregar nuevos módulos sin modificar los existentes.
5. **Auditoría:** `AuditLog` registra toda acción significativa del sistema.
6. **Internacionalización:** Moneda explícita en todas las transacciones financieras; preparación para multi-idioma.
7. **Prisma v7 compatible:** Sin `url` en `schema.prisma`; `DATABASE_URL` vía variable de entorno; configuración en `prisma.config.ts` si fuera necesario.

---

## 8. Diagrama de dependencias entre módulos

```
Config ───────────────────────────────────────┐
                                               │
Auth ──→ Users/Roles ──→ Companies ──→ Clients │
                                              │
Catalog (Products) ←──── Print Techniques     │
  │               │                            │
  │    ┌──────────┘                            │
  │    ▼                                       │
Budgets ──→ Orders ──┬──→ Payments            │
  │                │     │                       │
  │                │     ▼                     │
  │                │  Invoices                 │
  │                │                           │
  │                ├──→ Shipments ──→ Notifications
  │                │                           │
  └────────────────┼───────────────────────────┘
                   │
         Production ──→ Inventory
                   │
                   ▼
              Notifications ←── Todos
                   │
                   ▼
              Reports ←── Todos
                   │
                   ▼
              Admin ──→ Todos
```

---

## 9. Flujos principales (overview)

### Flujo de compra del cliente
```
Cliente navega Catálogo → Selecciona variante → Crea Presupuesto →
  Administrador acepta → Se genera Pedido → Se registra Pago →
  Se emite Factura → Pedido entra Producción → Se genera Envío →
  Cliente recibe notificación → Se registra en Auditoría
```

### Flujo de administración
```
Admin ingresa → Dashboard → Ve Reportes → Gestiona Usuarios/Empresas →
  Configura impuestos y monedas → Supervisa Producción → Revisa Auditoría
```
