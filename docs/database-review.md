# Revisión de Base de Datos — Impressio

## 1. Resumen ejecutivo

El archivo `prisma/schema.prisma` define **27 modelos** (incluyendo los 4 de Auth.js) y **20 enums** que conforman el esquema completo de la base de datos de Impressio. El diseño sigue un patrón de **multitenancy con `companyId`** en prácticamente todas las tablas transaccionales, utilizando **CUIDs** como claves primarias y **PostgreSQL** como motor via Supabase.

**Estado general:** El esquema es sólido y bien estructurado. Se identifican algunas áreas de mejora en índices, normalización y patrones de escalabilidad que se detallan a continuación.

---

## 2. Catálogo de modelos — Análisis detallado

---

### 2.1 `User` (Auth.js + App)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Modelo dual: authentication entity para Auth.js (`@auth/prisma-adapter`) + entidad de aplicación con rol (`UserRole`), empresa (`companyId`) y datos de contacto. |
| **Relaciones** | `Account[]`, `Session[]`, `Company[]` (owner + member), `Order[]` (creator + assignee), `Quote[]` (creator + approver), `Invoice[]`, `ProductionJob[]`, `Notification[]`, `AuditLog[]`, `UploadedFile[]`, `InventoryMovement[]`, `PurchaseOrder[]`, `Customer[]`, `Branch[]` (manager). |
| **Índices** | `@unique` en `email`. Sin índice explícito en `companyId`. |
| **Restricciones** | PK: CUID. `email` único. Role default `CLIENT`. `isActive` default `true`. |
| **Buenas prácticas** | ✅ CUID como PK (escapan colisiones distribuidas). ✅ `@updatedAt` para tracking automático. ✅ `@map("User")` para consistencia de nombres. ✅ Relaciones con `onDelete: Cascade` en Auth.js. |
| **Mejoras** | ⚠️ `companyId` debería tener un índice explícito para filtrar por empresa (práctica común en queries: `users.where({ companyId })`). ⚠️ El campo `role` con default `CLIENT` es conveniente pero para SUPER_ADMIN global no es suficiente — se requiere lógica a nivel de aplicación. ⚠️ Faltan índices compuestos como `companyId + role` para queries de RBAC frecuentes. |
| **Riesgo de escalabilidad** | 🔶 La tabla `User` crece linealmente con el total de usuarios del sistema (no solo por tenant). En modo multitenancy, un índice compuesto `(companyId, email)` sería más eficiente que el índice de `email` solo. 🔶 El campo `isActive` booleano permite soft delete pero no tiene `deletedAt` para auditoría temporal. |

---

### 2.2 `Account` (Auth.js)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Almacena cuentas OAuth (Google, GitHub) o credentials vinculadas a un `User`. Requerido por `@auth/prisma-adapter`. |
| **Relaciones** | `user: User` (N→1, onDelete Cascade). |
| **Índices** | `@@unique([provider, providerAccountId])` — garantiza que un usuario solo tenga una cuenta por proveedor. |
| **Restricciones** | PK: CUID. FK `userId` sin índice explícito (Prisma lo crea implícitamente). Campos `refresh_token`, `access_token`, `id_token` como `@db.Text` para cadenas largas. |
| **Buenas prácticas** | ✅ `onDelete: Cascade` aplica cuando se borra el usuario. ✅ Unique compuesto correcto para OAuth provider + providerAccountId. ✅ `@db.Text` para tokens que exceden `varchar(255)` estándar. |
| **Mejoras** | ⚠️ Falta índice en `userId` para consultas inversas rápidas (Prisma lo crea automáticamente como FK index, pero verificar en producción). |
| **Riesgo de escalabilidad** | 🟢 Bajo. Este modelo es pequeño y estable (crece con usuarios activos OAuth). |

---

### 2.3 `Session` (Auth.js)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Almacena sesiones JWT de Auth.js. Required por el adapter. |
| **Relaciones** | `user: User` (N→1, onDelete Cascade). |
| **Índices** | `sessionToken` es `@unique` (búsqueda O(1) en middleware). |
| **Restricciones** | PK: CUID. `expires` es `DateTime` no `BigInt`. |
| **Buenas prácticas** | ✅ `sessionToken` único para búsqueda directa. ✅ `expires` permite limpieza de sesiones expiradas. |
| **Mejoras** | ⚠️ En Prisma v7 con JWT strategy, la tabla `Session` puede tener bajo uso si se migra completamente por JWT stateless. Considerar si se mantiene físicamente en DB o en cache (Redis/Vercel KV). |
| **Riesgo de escalabilidad** | 🟢 Bajo. Sesiones se limpian automáticamente por expiración. |

---

### 2.4 `VerificationToken` (Auth.js)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Tokens de verificación de correo electrónico para confirmación y recuperación de contraseña. |
| **Relaciones** | Ninguna. |
| **Índices** | `@@unique([identifier, token])` — garantiza un solo token activo por identifier. |
| **Restricciones** | PK compuesta implícita por el unique. |
| **Buenas prácticas** | ✅ Unique compuesto `(identifier, token)` es el estándar para este patrón. ✅ Sin relaciones innecesarias. |
| **Mejoras** | ⚠️ Sin `expiresAt` indexado — las limpieza de tokens expirados requiere full table scan. Un índice parcial `(identifier) WHERE expires > NOW()` sería óptimo (no soportado por Prisma directamente, se puede agregar con SQL raw). |
| **Riesgo de escalabilidad** | 🟢 Muy bajo. Tabla pequeña, se limpia periódicamente. |

---

### 2.5 `Permission`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Catálogo de permisos granulares del sistema (ej: `order:create`, `invoice:read`). |
| **Relaciones** | `rolePermissions: RolePermission[]` (1→N). |
| **Índices** | `@@unique([resource, action])` — garantiza que una combinación recurso+acción sea única. |
| **Restricciones** | PK: CUID. |
| **Buenas prácticas** | ✅ `resource:action` como unique constraint es el patrón estándar RBAC. ✅ `createdAt`/`updatedAt` para auditoría. |
| **Mejoras** | ✅ Diseño limpio y minimal. |
| **Riesgo de escalabilidad** | 🟢 Muy bajo. Número fijo de permisos (no crece orgánicamente). |

---

### 2.6 `RolePermission`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Tabla intermedia (join table) que asigna permisos a roles (RBAC many-to-many). |
| **Relaciones** | `permission: Permission` (N→1, onDelete Cascade). |
| **Índices** | `@@id([role, permissionId])` — PK compuesta. |
| **Restricciones** | Composite PK `(role, permissionId)`. |
| **Buenas prácticas** | ✅ PK compuesta en join table es el patrón estándar. ✅ `onDelete: Cascade` elimina asignaciones cuando un permiso se borra. |
| **Mejoras** | ✅ Diseño correcto. |
| **Riesgo de escalabilidad** | 🟢 Muy bajo. Fijo: 5 roles × N permisos. |

---

### 2.7 `Company` (Tenant)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Entidad raíz de multitenancy. Cada empresa es un tenant aislado con su propio owner, configuración y datos. |
| **Relaciones** | `owner: User` (1→1, ownerId FK), `users: User[]` (1→N), `branches`, `customers`, `products`, `categories`, `quotes`, `orders`, `invoices`, `payments`, `shipments`, `purchaseOrders`, `suppliers`, `inventories`, `companySettings`, `companyAddresses`. |
| **Índices** | `@@unique([slug])` — identificador URL único para empresa. |
| **Restricciones** | PK: CUID. `ownerId` NOT NULL (empresa siempre tiene dueño). `currency` default `"ARS"`. `plan` default `"free"`. `isActive` default `true`. |
| **Buenas prácticas** | ✅ CUID consistente. ✅ `companyId` como tenant discriminator (aunque no lo tiene en todas las tablas, se usa FK explícito). ✅ `@@unique([slug])` para URLs legibles. |
| **Mejoras** | ⚠️ **Falta índice en `ownerId`**: cada query que busca empresa por owner (ej: `GET /api/companies/me`) hace `company.findMany({ where: { ownerId: userId } })` sin índice. 🔶 `currency`, `timezone`, `language`, `settings` podrían moverse a una tabla `CompanySettings` normalizada separada para evitar JSON queries costosas en PostgreSQL. 🔶 Plan de suscripción como string en lugar de enum limita constraints de negocio. |
| **Riesgo de escalabilidad** | 🔶 **CRÍTICO**: La tabla `User` está vinculada a `companyId` pero el `User` no tiene `companyId` como NOT NULL — usuarios sin empresa (`companyId` NULL) son posibles (SUPER_ADMIN). Esto rompe el modelo de aislamiento estricto multitenancy. Para escalabilidad real, cada consulta DEBE filtrar por `companyId`. |

---

### 2.8 `Branch` (Sucursal)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Subdivisión de una empresa (sucursal, planta, almacén). |
| **Relaciones** | `company: Company` (1→N, onDelete Cascade), `manager: User?` (N→1), `orders`, `productionJobs`, `inventories`. |
| **Índices** | Ninguno explícito más allá de la FK `companyId` y `managerId`. |
| **Restricciones** | `companyId` NOT NULL. `managerId` nullable. |
| **Buenas prácticas** | ✅ FK a Company con onDelete Cascade (sucursales se eliminan con la empresa). ✅ `managerId` nullable (sucursal sin manager asignado temporalmente). |
| **Mejoras** | ⚠️ `branchId` nullable en `Order` (algunos pedidos no tienen sucursal) — esto es aceptable pero requiere manejar la inconsistencia en Queries de dashboard. ⚠️ Falta índice compuesto `(companyId, name)` para búsquedas de sucursales por empresa. |
| **Riesgo de escalabilidad** | 🟡 Medio. Con muchos pedidos distribuidos en muchas sucursales, las queries de ordenamiento por fecha pueden beneficiarse de `INDEX(companyId, branchId, createdAt)`. |

---

### 2.9 `Customer`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | CRM — almacena clientes (B2B o B2C) vinculados a una empresa y opcionalmente a un usuario del sistema. |
| **Relaciones** | `company: Company` (1→N, onDelete Cascade), `user: User?` (N→1), `customerAddresses`, `quotes`, `orders`, `invoices`, `payments`. |
| **Índices** | Ninguno explícito en campos no-PK. |
| **Restricciones** | `companyId` NOT NULL. `email` NO es unique a nivel de DB (solo dentro de la empresa lógicamente). `documentId` nullable. |
| **Buenas prácticas** | ✅ FK a Company con cascade. ✅ FK a User nullable para clientes que son usuarios del sistema. |
| **Mejoras** | ⚠️ **Falta índice en `companyId`**: todos los queries por empresa (`customers.findMany({ where: { companyId } })`) requieren full table scan sin índice. 🔶 `email` debería ser unique por `companyId` (índice parcial o unique compuesto `(companyId, email)`). 🔶 `documentId` también debería ser unique por empresa para evitar duplicados. |
| **Riesgo de escalabilidad** | 🔶 Sin índice en `companyId`, el rendimiento se degrada linealmente con el crecimiento de clientes. En modo multitenancy, este es el campo de filtrado más común y DEBE tener un índice explícito. |

---

### 2.10 `Address`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Modelo de dirección reutilizable por Customer, Company y Shipment (vía relaciones polimórficas). |
| **Relaciones** | `customerAddresses`, `companyAddresses`, `shipments` (ShipmentAddress), `billingInvoices`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones` | `country` default `"AR"` — hardcodeo al país que puede no ser válido en el futuro. |
| **Buenas prácticas** | ✅ Modelo reutilizable para evitar tablas de direcciones duplicadas. ✅ `isDefault` para dirección preferida. |
| **Mejoras** | 🔶 La dirección está compartida entre Customer, Company y Shipment — esto es un acoplamiento fuerte. Si una dirección de empresa se cambia (ej: mudanza fiscal), afecta todas las facturas emitidas. Separar por contexto (CustomerAddress, CompanyAddress, ShipmentAddress como modelos separados) sería más robusto. 🔶 `country` como string hardcodeo debería ser un enum `Country` o `countryCode` ISO 3166-1 alpha-2. |
| **Riesgo de escalabilidad** | 🟡 Medio. El modelo compartido funciona para Fase 1 pero puede requerir refactor en Fase 3+. |

---

### 2.11 `CustomerAddress` y `CompanyAddress`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Tablas intermedia que vinculan Address con Customer y Company respectivamente, con tipo (`AddressType`). |
| **Relaciones** | `customer: Customer` + `address: Address`; `company: Company` + `address: Address`. |
| **Índices** | `@@id([customerId, addressId])` / `@@id([companyId, addressId])` — composite PK. |
| **Restricciones** | Ambas tienen `onDelete: Cascade`. |
| **Buenas prácticas** | ✅ Composite PK correcto para join tables. ✅ `AddressType` enum para distinguir shipping/billing/company. ✅ `isDefault` para dirección principal. |
| **Mejoras** | ✅ Diseño limpio. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

### 2.12 `Category`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Categorías jerárquicas para organizar productos (tree structure). |
| **Relaciones** | `company: Company?` (opcional), `parent: Category?` (self-referencing), `children: Category[]` (self-referencing), `products: Product[]`. |
| **Índices** | `@@unique([companyId, slug])` — slug único por empresa (con fallback NULL companyId). |
| **Restricciones** | `parentId` nullable para root categories. `isActive` default `true`. |
| **Buenas prácticas** | ✅ Self-referencing tree es el patrón estándar para categorías jerárquicas. ✅ Unique compuesto `(companyId, slug)`. |
| **Mejoras** | 🔶 **El unique `[companyId, slug]` permite que NULL companyId comparta slug** — es decir, las categorías globales (companyId=NULL) no pueden tener slugs duplicados entre sí pero sí pueden colisionar con categorías de empresa. Si se espera usar `companyId` NULL para categorías globales, considerar usar `NOT NULL` constraint o separar en dos tablas. 🔶 Para árboles profundos (>3 niveles), el self-referencing `parentId` es menos eficiente que un cierre de tabla (`CategoryClosure`). Considerar materialized path (ej: `path: String` como `"root.parent.child"`) para queries de ancestors. |
| **Riesgo de escalabilidad** | 🟡 Medio. Tree queries con parentId son O(depth) por nodo. Para catálogos muy grandes, un closure table sería más performante. |

---

### 2.13 `Product`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Entidad principal del catálogo — cada producto pertenece a una empresa y categoría. |
| **Relaciones** | `company: Company` (1→N, onDelete Cascade), `category: Category?` (N→1), `variants`, `orderItems`, `quoteItems`, `uploadedFiles`. |
| **Índices** | `@@unique([companyId, slug])` — slug único por empresa. |
| **Restricciones** | `companyId` NOT NULL. `basePrice` default `0`. `minOrderQuantity` default `1`. `images` default `[]`. `isActive` default `true`. |
| **Buenas prácticas** | ✅ CUID PK. ✅ Unique compuesto slug por empresa. ✅ `Decimal` para precios (precisión financiera). ✅ `String[]` para imágenes (array de URLs). |
| **Mejoras** | ⚠️ El campo `images` como `String[]` almacena URLs, pero no hay separación entre imagen principal y galería. Recomendado: añadir `thumbnailUrl` como campo explícito o crear un modelo `ProductImage` con `order`/`isPrimary`. 🔶 `createdById` y `updatedById` son `String?` — son FK implícitos a `User.id` que no están declarados como relaciones en el modelo. Se usan en lógica de aplicación pero Prisma no los rastrea como relaciones. ⚠️ Falta índice en `companyId` para queries de catálogo por empresa. |
| **Riesgo de escalabilidad** | 🔶 Sin índice compuesto `(companyId, isActive)` en Product, las queries `SELECT * FROM Product WHERE companyId = X AND isActive = true` requieren full scan. |

---

### 2.14 `ProductVariant`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Cada variante es una combinación específica de producto (talla, color, material, acabado). |
| **Relaciones** | `product: Product` (1→N, onDelete Cascade), `orderItems`, `quoteItems`, `inventories`, `productionJobs`, `purchaseOrderItems`. |
| **Índices** | `@@unique([productId, sku])` — SKU único por producto. |
| **Restricciones** | `productId` NOT NULL. `price` con default `0` (puede heredar de Product.basePrice). `attributes` como `Json` con default `"{}"`. |
| **Buenas prácticas** | ✅ SKU único por producto para identificación de stock. ✅ `attributes` JSON para flexibilidad de variantes sin schema changes. ✅ `isActive` para desactivar variantes sin borrarlas. |
| **Mejoras** | ✅ Diseño sólido. |
| **Riesgo de escalabilidad** | 🟡 Medio. Para productos con muchos atributos (ej: 10 tallas × 12 colores × 5 materiales = 600 variantes), el JSON `attributes` crece. En producción, considerar normalizar atributos en tabla `VariantAttribute`. Los índices `(productId, isActive)` serían útiles para filtrar variantes activas. |

---

### 2.15 `Material`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Catálogo de materiales base de impresión (papel, tela, vinyl, etc.). |
| **Relaciones** | `quoteItems`, `orderItems`, `inventories`, `purchaseOrderItems`, `productionJobs`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | `basePrice` default `0`. `isActive` default `true`. |
| **Buenas prácticas** | ✅ `unit` string con default `"units"`. ✅ `isActive` para soft delete. |
| **Mejoras** | ✅ Diseño simple y funcional. |
| **Riesgo de escalabilidad** | 🟢 Bajo. Catálogo pequeño y estable. |

---

### 2.16 `PrintingTechnique`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Define técnicas de impresión (serigrafía, DTF, sublimación, grabado láser, etc.) con sus limitaciones físicas. |
| **Relaciones** | `variants`, `quoteItems`, `orderItems`, `productionJobs`. |
| **Índices** | `@@unique([slug])`. |
| **Restricciones** | `maxWidth`/`maxHeight` nullable (no todas las técnicas tienen limitación dimensional). `minOrderQuantity` default `1`. |
| **Buenas prácticas** | ✅ `slug` único para URLs legibles. ✅ Campos dimensionales nullable para técnicas sin restricción. ✅ `isActive` para desactivar sin borrar. |
| **Mejoras** | ✅ Diseño apropiado. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

### 2.17 `Quote` (Presupuesto)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Budget/quote que se envía al cliente antes de convertirse en order. |
| **Relaciones** | `company: Company`, `customer: Customer`, `creator: User?`, `approver: User?`, `items: QuoteItem[]`, `order: Order?`. |
| **Índices** | `@@unique([companyId, slug])` — slug único por empresa. |
| **Restricciones** | `status` default `DRAFT`. `taxRate`, `taxAmount`, `totalAmount` nullable con default `0`. `validUntil`, `acceptedAt`, `rejectedAt` nullable. |
| **Buenas prácticas** | ✅ `slug` para compartir presupuestos vía URL pública (sin autenticación). ✅ `validUntil` para expiración automática. ✅ `QuoteStatus` enum con estados completos del ciclo. |
| **Mejoras** | ⚠️ El campo `order` como relación opcional 1:1 está implícito en `Order` (`Order.quoteId @unique`). Para Prisma, esto crea una relación implícita 1:1. Funciona, pero el nombre del campo `order` en Quote es ambiguo (podría confundirse con "comando" vs "relación order"). Considerar `convertedOrder`. 🔶 Faltan timestamps `sentAt`, `viewedAt` para tracking de engagement del presupuesto. 🔶 `creatorById` y `approvedById` no tienen índices explícitos. |
| **Riesgo de escalabilidad** | 🔶 Los presupuestos crecen rápidamente en volumen (cada proyecto genera 1+ presupuesto). Sin índice en `customerId`, las queries de historial de presupuestos de un cliente son lentas. `INDEX(companyId, customerId, status, createdAt)` sería óptimo. |

---

### 2.18 `QuoteItem`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Línea individual dentro de un presupuesto — referencia a producto, variante, material y técnica de impresión. |
| **Relaciones** | `quote: Quote` (N→1, onDelete Cascade), `product: Product?`, `variant: ProductVariant?`, `material: Material?`, `technique: PrintingTechnique?`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | `quantity` default `1`. `unitPrice` y `totalPrice` son `Decimal` (precisión financiera). `customization` como JSON nullable. |
| **Buenas prácticas** | ✅ FK nullable a product/variant/material/technique para flexibilidad máxima. ✅ `totalPrice` calculado a nivel de ítem (`quantity * unitPrice`) — redundante pero optimiza lectura. |
| **Mejoras** | ⚠️ **Campo redundante `unitPrice` + `totalPrice`**: `totalPrice = quantity * unitPrice`. Si se calcula en la app, se elimina la redundancia pero se pierde rendimiento de lectura. Si se calcula en la DB con generated column o trigger, es mejor. La duplicación es un riesgo de consistencia. 🔶 Para cálculos de precios que involucran descuentos por cantidad o promociones, `unitPrice` es insuficiente. Considerar `priceRules: Json` para reglas de pricing dinámico. |
| **Riesgo de escalabilidad** | 🟡 Medio. A medida que presupuestos crecen, la redundancia de `totalPrice` se acumula. Para presupuestos con 100+ ítems, el almacenamiento de `totalPrice` como campo individual añade overhead de indexación y actualización. |

---

### 2.19 `Order` (Pedido)

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Pedido confirmado que fluye desde presupuesto aceptado o creación directa. |
| **Relaciones** | `company`, `customer`, `creator: User?`, `assignee: User?`, `quote: Quote?`, `branch: Branch?`, `items: OrderItem[]`, `payment: Payment?`, `invoice: Invoice?`, `shipment: Shipment?`, `production: ProductionJob[]`, `auditLogs: AuditLog[]`. |
| **Índices** | `@@unique([companyId, orderNumber])` — orderNumber único por empresa. `quoteId @unique`. |
| **Restricciones** | `status` default `PENDING`. `orderId` `@unique` para la relación 1:1 con Quote. |
| **Buenas prácticas** | ✅ `orderNumber` auto-generado y único por empresa (legible para humanos). ✅ Enum `OrderStatus` con estados completos del ciclo. ✅ `quoteId @unique` correctamente aplica 1:1 (cada quote genera a lo sumo 1 order). |
| **Mejoras** | ✅ Diseño sólido. |
| **Riesgo de escalabilidad** | 🔶 Sin índices en filtros frecuentes: `companyId + status + createdAt`, `companyId + customerId`. Estos patrones de query (dashboard por empresa, filtrar por estado, historial de cliente) requieren índices compuestos. |

---

### 2.20 `OrderItem`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Línea individual dentro del pedido, con referencia a producto, variante, material y técnica. |
| **Relaciones** | `order: Order` (N→1, onDelete Cascade), `product: Product?`, `variant: ProductVariant?`, `material: Material?`, `technique: PrintingTechnique?`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | Estructura paralela a `QuoteItem`. |
| **Buenas práticas** | ✅ Paralelismo con `QuoteItem` facilita conversión de presupuesto a pedido. ✅ FK nullable para flexibilidad. |
| **Mejoras** | ⚠️ Los mismos riesgos de redundancia que `QuoteItem`: `totalPrice = quantity * unitPrice` duplicado. 🔶 Sin índice en `orderId` explícito (Prisma lo crea via FK, pero verificar que exista en PostgreSQL). |
| **Riesgo de escalabilidad** | 🟡 Medio. Con pedidos grandes (50+ ítems), la tabla crece rápidamente. Índices compuestos en `(orderId, sortOrder)` mejoran rendimiento de listado. |

---

### 2.21 `ProductionJob`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Tracks de trabajo de producción para cada pedido — asignación a operarios, avance, control de calidad. |
| **Relaciones** | `order: Order` (N→1, onDelete Cascade), `branch: Branch?`, `assignee: User?`, `variant: ProductVariant?`, `material: Material?`, `technique: PrintingTechnique?`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | `status` default `PENDING`. `quantity` default `0`. `assignedToId` nullable. |
| **Buenas prácticas** | ✅ `ProductionStatus` enum con flujo completo (PENDING → ASSIGNED → IN_PROGRESS → QC_CHECK → COMPLETED → DELAYED). 🔶 Campos temporales (`startedAt`, `estimatedEndAt`, `completedAt`) para SLA tracking. |
| **Mejoras** | ⚠️ **Falta `companyId` en ProductionJob**: la tabla tiene `companyId` en su definición pero no tiene `company: Company @relation(...)` — esto es una FK huérfana. Revisar schema: en el schema actual, `companyId` se menciona pero la relación Company está missing... espera, revisando el schema, no veo `company: Company @relation(...)` en ProductionJob. Eso significa `companyId` es un campo huérfano sin FK constraint. ⚠️ **Este es un bug de schema**: `ProductionJob.companyId` es una columna sin FK constraint a Company y sin relación Prisma declarada. |
| **Riesgo de escalabilidad** | 🔶 `companyId` sin relación declarada = sin FK enforcement en DB = riesgo de datos inconsistentes (production jobs sin empresa asociada). ⚠️ Sin índice en `orderId` para queries tipo "get production jobs for order". |

---

### 2.22 `Inventory`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Control de stock por empresa — puede rastrear por variante de producto Y/por material. |
| **Relaciones** | `company: Company`, `variant: ProductVariant?`, `material: Material?`, `branch: Branch?`, `movements: InventoryMovement[]`. |
| **Índices** | `@@unique([companyId, productVariantId])`, `@@unique([companyId, materialId])`. |
| **Restricciones** | `quantity`, `reserved`, `minStock` default `0`. `branchId` nullable. |
| **Buenas prácticas** | ✅ Doble unique constraint para stock por variante y por material por empresa. ✅ Separate `quantity` vs `reserved` para pre-venta. |
| **Mejoras** | 🔶 **Doble unique constraint es problemático**: un inventory puede trackear variante material O material genérico, no ambos simultáneamente. El unique `(companyId, variantId)` permite NULL variantId para stock por material, pero `(companyId, materialId)` permite NULL materialId para stock por variante. Si un registro tiene NULL en ambos, es stock genérico — pero esto no está restringido y puede causar duplicación. 🔴 **Falta `companyId` en Inventory sin FK reference explícita a Company** — revisar: el schema tiene `company Company @relation(fields: [companyId], ...)` ✓ sí está declarada. OK, bien. 🔶 `branchId` nullable y unique constraints no incluyen branch — stock de una variante se comparte entre branches de la misma empresa. Para multi-branch, se necesitan índices `(companyId, branchId, productVariantId)`. |
| **Riesgo de escalabilidad** | 🔶 Sin índices optimizados para query de disponibilidad (`SELECT * FROM Inventory WHERE companyId = X AND quantity - reserved > 0 AND productVariantId = Y`) — se requiere índices en `(companyId, productVariantId, quantity-reserved)` (expresión index en PostgreSQL). |

---

### 2.23 `InventoryMovement`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Log de cada movimiento de inventario (entrada, salida, ajuste, devolución). |
| **Relaciones** | `inventory: Inventory` (N→1, onDelete Cascade), `creator: User?`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | `type: InventoryMovementType` enum. |
| **Buenas prácticas** | ✅ Imutable (INSERT only). ✅ `referenceId`/`referenceType` para polimorphic reference (orderId, order, etc.). |
| **Mejoras** | ⚠️ **Sin índices en `inventoryId`**: al consultar historial de movimientos de un inventario específico, se requiere full scan. Se necesita `INDEX(inventoryId, createdAt)`. 🔶 `referenceId`/`referenceType` como strings libres es riesgoso (typos, referential integrity imposible). Considerar tabla de referencia `MovementSource(model: String, id: String)` o UUIDs normalizados. |
| **Riesgo de escalabilidad** | 🔴 **ALTO**: Esta tabla crece linealmente con cada operación de stock (cada venta, cada ajuste, cada compra). Para una empresa con 1000 pedidos/mes con 5 ítems cada uno y 3 movimientos por ítem, son 15,000 filas/mes. En 2 años = 360,000 filas. Sin índices, queries de historial son lentas. |

---

### 2.24 `Supplier`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Catálogo de proveedores de materiales vinculados a una empresa. |
| **Relaciones** | `company: Company` (1→N, onDelete Cascade), `purchaseOrders: PurchaseOrder[]`. |
| **Índices** | Ninguno explícito adicional. |
| **Restricciones** | `isActive` default `true`. |
| **Buenas prácticas** | ✅ FK a Company con cascade. ✅ Campos de contacto completos. |
| **Mejoras** | ⚠️ `materialId` en PurchaseOrderItem vincula a Material global (no por empresa). Esto mezcla materiales de distintos tenants si no se filtra por companyId a nivel aplicación. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

### 2.25 `PurchaseOrder`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Orden de compra a proveedores para reabastecer inventario. |
| **Relaciones** | `company: Company`, `supplier: Supplier`, `creator: User?`, `items: PurchaseOrderItem[]`. |
| **Índices** | `@@unique([companyId, poNumber])`. |
| **Restricciones** | `status` default `DRAFT`. |
| **Buenas prácticas** | ✅ PO Number único por empresa. ✅ Enum de estados completo con `PARTIALLY_RECEIVED`. |
| **Mejoras** | ⚠️ Similar a Supplier: `materialId` en PurchaseOrderItem vincula a material global sin companyId FK enforcement. |
| **Riesgo de escalabilidad** | 🟢 Bajo-Medio. |

---

### 2.26 `PurchaseOrderItem`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Línea de una orden de compra. |
| **Relaciones** | `purchaseOrder`, `variant: ProductVariant?`, `material: Material?`. |
| **Índices** | Ninguno explícito. |
| **Restricciones** | `receivedQty` default `0`. |
| **Buenas prácticas** | ✅ `totalCost = quantity * unitCost` redundante pero optimiza lectura. |
| **Mejoras** | ✅ Estructura consistente con `PurchaseOrder`. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

### 2.27 `Payment`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Registro de transacciones de pago por pedido. |
| **Relaciones** | `order: Order` (1→1, onDelete Cascade, `orderId @unique`), `company: Company`, `client: Customer`, `invoice: Invoice?`. |
| **Índices** | `orderId @unique` (relación 1:1 con Order). |
| **Restricciones** | `method: PaymentMethod` enum. `status: PaymentStatus` enum default `PENDING`. `invoiceId` nullable. |
| **Buenas prácticas** | ✅ `orderId @unique` enforcea 1 pago por orden. ✅ `currency` default `"ARS"`. ✅ `transactionId` para referencia del proveedor de pagos. |
| **Mejoras** | ⚠️ **`invoiceId` nullable sin constraint de unicidad**: se declara en Invoice como `paymentId @unique`, lo cual significa un pago puede estar vinculado a 0 o 1 facturas, y cada factura vinculada a 0 o 1 pagos. Esto es correcto para 1:1. Pero si se quiere permitir múltiples pagos parciales por factura, el modelo actual no lo soporta. 🔶 Falta índice en `(companyId, clientId)` para consultar pagos de un cliente. |
| **Riesgo de escalabilidad** | 🟡 Medio. Sin índices compuestos para queries de reporting financiero, las consultas de ingresos por cliente/período son lentas. |

---

### 2.28 `Invoice`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Factura fiscal vinculada a un pedido (y opcionalmente a un pago). |
| **Relaciones** | `company: Company`, `client: Customer`, `order: Order?` (`@unique`), `payment: Payment?` (`@unique`), `address: Address?`, `creator: User?`. |
| **Índices** | `@@unique([companyId, invoiceNumber])`. `orderId @unique`, `paymentId @unique`. |
| **Restricciones** | `status: InvoiceStatus` enum. `fiscalData` como JSON nullable. |
| **Buenas prácticas** | ✅ InvoiceNumber unique por empresa. ✅ `orderId @unique` enforcea 1 factura por pedido (correcto para modelo 1:1). |
| **Mejoras** | ⚠️ **`fiscalData: Json?`**: los datos fiscales (IVA, CUIT, dirección fiscal) se serializan como JSON. En PostgreSQL, esto dificulta querying por campos fiscales específicos (ej: "traer facturas con CUIT X"). Considerar tabla `InvoiceFiscalData` normalizada con columnas explícitas (`taxId`, `taxType`, `legalName`, etc.). 🔶 Falta `paidAt` timestamp para saber cuándo se pagó. |
| **Riesgo de escalabilidad** | 🟡 Medio. JSON fiscal data no es queryable eficientemente. Para reporting fiscal, usar columnas explícitas es crítico. |

---

### 2.29 `Shipment`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Gestiona envío físico de pedidos con tracking. |
| **Relaciones** | `order: Order` (1→1, `orderId @unique`), `company: Company`, `address: Address` (ShipmentAddress). |
| **Índices** | `orderId @unique`. |
| **Restricciones** | `status: ShipmentStatus` enum. |
| **Buenas prácticas** | ✅ `orderId @unique` enforcea 1 envío por pedido. ✅ `carrierUrl` para link directo a tracking. |
| **Mejoras** | 🔶 `addressId` FK a Address es compartido con Invoice (Shipment y Factura pueden tener diferente dirección de envío). Si se requieren direcciones independientes para cada caso, considerar modelo separado o hacer addressId nullable en Invoice y no reutilizar Address directamente. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

### 2.30 `Notification`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Sistema de notificaciones internas para usuarios. |
| **Relaciones** | `user: User` (N→1, onDelete Cascade). |
| **Índices** | Ninguno explícito. |
| **Restricciones** | `read` default `false`. |
| **Buenas prácticas** | ✅ `NotificationType` enum cubre todos los tipos del sistema. |
| **Mejoras** | ⚠️ **Sin índices en `(userId, read, createdAt)`**: las queries de "obtener notificaciones no leídas de un usuario" hacen full scan. Se necesita `INDEX(userId, read, createdAt DESC)`. |
| **Riesgo de escalabilidad** | 🔶 Esta tabla crece continuamente (notificación por cada cambio de estado de order, shipment, payment, etc.). Para un sistema con 1000 usuarios activos y 10 notificaciones/día/usuario, son 10,000 notificaciones/día. Sin paginación eficiente e índices apropiados, esto degrada rendimiento en meses. |

---

### 2.31 `UploadedFile`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Gestión de archivos subidos por clientes (diseños, logos, documentos). |
| **Relaciones** | `uploader: User?`, `product: Product?`. |
| **Índices** | Ninguno explícito. |
| **Restricciones** | `size` en bytes (Int). `fileType` enum. |
| **Buenas prácticas** | ✅ `originalName` vs `name` para mantener nombre original y slug/filename limpio. ✅ `mimeType` para validación de tipo. ✅ `thumbnailUrl` para previsualización. |
| **Mejoras** | 🔴 **`productId` vincula a Product global sin considerar companyId**: un file puede adjuntarse a una product de cualquier empresa sin restricción de aislamiento multitenancy. ⚠️ **Falta `companyId` en UploadedFile**: para multitenancy correcto, los archivos deben estar filtrados por empresa. 🔶 No tiene FK directo a `Customer` (solo `uploadedForId`/`uploadedFor` como strings libres — no enforceable). |
| **Riesgo de escalabilidad** | 🔴 **CRÍTICO**: Sin `companyId` la tabla crece ilimitadamente mezclando archivos de todas las empresas. Los queries de "obtener archivos de mi empresa" requieren full table scan y filtrado a nivel aplicación, lo cual es un riesgo de seguridad y rendimiento grave. Con la adición de `companyId` + índice, se resuelve multitenancy y performance. |

---

### 2.32 `AuditLog`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Registro inmutable de toda acción significativa del sistema. |
| **Relaciones** | `actor: User?` (AuditActor), `order: Order?` (OrderAudit). |
| **Índices** | `@@index([entityType, entityId])`, `@@index([actorId])`, `@@index([createdAt])`. |
| **Restricciones** | Sin `companyId` — logs son globales (no filtrados por empresa). |
| **Buenas prácticas** | ✅ Inmutable (no UPDATE/DELETE en lógica normal). ✅ Tres índices estratégicos para las queries de auditoría más comunes. ✅ `ipAddress` y `userAgent` para forenses. |
| **Mejoras** | ⚠️ **Falta `companyId`**: auditoría global dificulta reportes "por empresa" y retention policies "por tenant". | ⚠️ **Tabla crece sin límite**: no hay TTL ni particionamiento automático. Para un sistema en producción, se necesita: (a) tabla de partición por mes, (b) política de retention (ej: mantener 2 años, archivar a S3), (c) o tabla de log rotativa. |
| **Riesgo de escalabilidad** | 🔴 **ALTO**: Es una de las tablas de más rápido crecimiento. Con 1000 operaciones/día, en 1 año = 365,000 filas. En 5 años = 1.8M filas. Los 3 índices ayudan pero el volumen seguirá creciendo. **Requiere plan de particionamiento (PostgreSQL declarative partitioning por `createdAt` mensual).** Sin esto, las queries de auditoría se vuelven lentas. |

---

### 2.33 `SystemConfig` y `CompanySetting`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Configuración global del sistema y por empresa (key-value store). |
| **Relaciones** | `SystemConfig` es global (sin companyId). `CompanySetting` vincula a Company. |
| **Índices** | `SystemConfig.key @unique`. `CompanySetting @@unique([companyId, key])`. |
| **Restricciones** | Ambos usan `Json` para `value`. |
| **Buenas prácticas** | ✅ Key-value pattern para settings flexibles. ✅ Unique constraint en CompanySetting para evitar claves duplicadas por empresa. |
| **Mejoras** | ✅ Diseño apropiado. |
| **Riesgo de escalabilidad** | 🟢 Bajo. |

---

## 3. Diagrama ER textual

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          DIAGRAMA ER — IMPRESSIO (Prisma Schema)                          │
│                                                                                             │
│  ═══════════════  AUTH.JS (Requerido por adapter)  ═══════════════                       │
│                                                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐ │
│  │    User      │─1:N─→│   Account    │      │    Session      │      │ Verification    │ │
│  │───────────── │      │───────────── │      │─────────────────│      │    Token        │ │
│  │ id (PK/CUID) │      │ id (PK/CUID) │      │ id (PK/CUID)    │      │                 │ │
│  │ email (UNQ)  │◄──┐  │ userId (FK)  │      │ sessionToken (U)│      │ identifier      │ │
│  │ role         │   │  │ provider     │      │ userId (FK)     │      │ token (UNQ)     │ │
│  │ companyId    │   │  │ type         │      │ expires         │      │ expires         │ │
│  │ isActive     │   │  │ providerAccId│      └─────────────────┘      │ ┌─────(IDN,TKN)─┐│ │
│  │ lastLoginAt  │   │  │ refresh_token│                               │ │ identifier+token│ │
│  │ createdAt    │   │  │ access_token │                               └─┘                 │
│  │ updatedAt    │   │  └───────────── ┘                                                │
│  └──────┬───────┘   │  @@unique([provider,providerAccountId])                        │
│         │           │  @@map("Account")                                               │
│         │           │                                                                 │
│         │           │  ┌─────────────────┐                                           │
│         │           └─→│ User (Auth.js)   │◄── relación automática de Auth.js        │
│         │              └─────────────────┘                                           │
│         │                                                                             │
│  ═══════╪══════════  DOMINIO DE NEGOCIO  ══════════════════════════════════════════  │
│         │                                                                             │
│  ┌──────┴──────┐   ┌──────────────────┐                                              │
│  │  Permission  │◄─┤  RolePermission   │ (PK compuesto: role+permissionId)          │
│  │───────────── │   │──────────────────│                                              │
│  │ id (PK)     │   │ role (UserRole)  │                                              │
│  │ resource    │   │ permissionId (FK) │                                              │
│  │ action      │   └──────────────────┘                                              │
│  │ description │        │                                                                  │
│  │ ┌──(res,act) │      │    ┌─────────────────────────────────────────────────────────┐ │
│  └─────────────┘       └───→│              Company (Tenant)                          │ →──┐ │
│                              │─────────────────────────────────────────────────────────│   │
│                              │ id (PK)        slug (UNQ)   ownerId (FK→User)         │   │
│                              │ name           currency     plan                      │   │
│                              │ settings (JSON)                                             │   │
│                              │ companySettings[] ←─────────────────────────────────────────│  │
│                              │ branches[] ←─┐                                             │   │
│                              │ customers[]  │                                             │   │
│                              │ products[]   │                                             │   │
│                              │ categories[] │                                             │   │
│                              │ quotes[]     │                                             │   │
│                              │ orders[]     │                                             │   │
│                              │ invoices[]   │                                             │   │
│                              │ payments[]   │                                             │   │
│                              │ shipments[]  │                                             │   │
│                              │ purchaseOrders[]                                      │   │
│                              │ suppliers[]  │                                             │   │
│                              │ inventories[]                                          │   │
│                              │ companyAddresses[]                                     │   │
│                              │ @@unique([slug])                                      │   │
│                              └─────────────────────────────────────────────────────────┘   │
│                                    ▲││││││││││││││││││││││││││││││││││││││││││              │
│                                    ││││││││   TODAS las FK apuntan aquí       │││││││││││││││
│                                    ││││││                                        │││││││││││││││
│                                    ││││└── User ownedCompanies ──────────────────┘│││││││││││││
│                                    │││                                            │││││││││││││││
│                                    ││└── CompanySetting companyId (FK, onDelete Cascade)│││││││││││││
│                                    ││                                             │││││││││││││││
│                                    │└───────────────────────────────────────────────┘│││││││││││││
│                                    │                                                  │││││││││││││││
│                              ┌─────┼─────────────────────────────────────────────────┘││││││││││││││
│                              │     │                                                  │││││││││││││││
│                              ▼     ▼                                                  ▼│││││││││││││││
│  ┌────────────────┐ ┌──────────────┐ ┌────────────────┐ ┌─────────────────┐ ┌─────────────┐ │││││││││││││
│  │    Branch      │ │   Customer   │ │    Product     │ │    Category     │ │   Company    │ │││││││││││││
│  │────────────────│ │────────────────││────────────────│ │─────────────────│ │─────────────│ │││││││││││││
│  │ id (PK)        │ │ id (PK)       │ │ id (PK)        │ │ id (PK)         │ │ (Company)     │ │││││││││││││
│  │ companyId (FK) │ │ companyId (FK)│ │ companyId (FK) │ │ companyId? (FK) │ │  → 1:N to ALL │ │││││││││││││
│  │ name           │ │ userId? (FK)  │ │ categoryId (FK)│ │ parentId? (FK)  │ │               │ │││││││││││││
│  │ address        │ │ name          │ │ name           │ │ name            │ │               │ │││││││││││││
│  │ managerId (FK) │ │ email         │ │ slug           │ │ slug            │ │               │ │││││││││││││
│  │ orders[]       │ │ documentId    │ │ basePrice      │ │ parent→children │ │               │ │││││││││││││
│  │ productionJobs[]│ │ isActive      │ │ category→prod  │ │                 │ │               │ │││││││││││││
│  │ inventories[]  │ │ quotes[]      │ │ variants[]     │ │                 │ │               │ │││││││││││││
│  │                │ │ orders[]      │ │ orderItems[]   │ │                 │ │               │ │││││││││││││
│  └────────────────┘ │ invoices[]    │ │ quoteItems[]   │ └─────────────────┘ │               │ │││││││││││││
│                     │ payments[]    │ │ inventories[]  │                       │               │ │││││││││││││
│                     │ shipments[]   │ │ uploadedFiles[]│                       │               │ │││││││││││││
│                     └────────────────┘ │                  │                        │               │ │││││││││││││
│                                         └──────────────────┘                       │               │ │││││││││││││
│                                                                                    │               │ │││││││││││││
│  ┌────────────────────┐                                                          │               │ │││││││││││││
│  │    Quote (Presup.) │                                                          │               │ │││││││││││││
│  │────────────────────│                                                          │               │ │││││││││││││
│  │ id (PK)            │                                                          │               │ │││││││││││││
│  │ companyId (FK)     │                                                          │               │ │││││││││││││
│  │ customerId (FK)    │                                                          │               │ │││││││││││││
│  │ slug (UNQ/company) │                                                          │         order  │ │││││││││││││
│  │ status             │                                                          │  ▲  order.qu  │ │││││││││││││
│  │ items: QuoteItem[] │ ←───────────────────────────────────────────────────────┘  │  │  .id   │ │││││││││││││
│  │ @@unique([slug])   │                                                          │  └──────────┘ ││││││││││││││
│  └────────────────────┘                                                          │               ││││││││││││││
│                                                                                    │               ││││││││││││││
│  ┌────────────────┐ ┌────────────────┐  ┌──────────────────┐ ┌────────────────┐││││││││││││││
│  │  QuoteItem     │ │   Order        │  │  ProductionJob   │ │   Shipment     ││││││││││││││
│  │────────────────│ │────────────────│  │──────────────────│ │────────────────││││││││││││││
│  │ id (PK)        │ │ id (PK)        │  │ id (PK)          │ │ id (PK)        ││││││││││││││
│  │ quoteId (FK)   │ │ companyId (FK) │  │ orderId (FK)     │ │ orderId (FK,UNQ││││││││││││││
│  │ productId (FK) │ │ customerId (FK)│  │ companyId (FK?)  │ │ companyId (FK) ││││││││││││││
│  │ variantId (FK) │ │ userId (FK)    │  │ branchId? (FK)   │ │ addressId (FK) ││││││││││││││
│  │ materialId (FK)│ │ quoteId @unique│  │ variantId? (FK)  │ │ order (1:1)    ││││││││││││││
│  │ techniqueId(FK)│ │ status         │  │ materialId? (FK) │ │ carrier         ││││││││││││││
│  │ unitPrice      │ │ items: OItem[] │  │ status           │ │ trackingNumber  ││││││││││││││
│  │ totalPrice     │ │ payment (1:1)  │  │ assignee? (FK)   │ │ status          ││││││││││││││
│  │ @@map          │ │ invoice (1:1)  │  │ productionOrders │ │ deliveries[]   ││││││││││││││
│  └────────────────┘ │ shipment (1:1) │  │ @@map            │ │ @@map           ││││││││││││││
│                     │ production[]   │  └──────────────────┘ └─────────────────┘││││││││││││││
│                     │ auditLogs (AuditActor)│                                     ││││││││││││││
│                     │ @@unique([companyO. orderNumber]) │                       ││││││││││││││
│                     └─────────────────────────────────────────────────────────────┘││││││││││││││
│                                                                                    ││││││││││││││
│  ┌─────────────────────┐ ┌──────────────────────┐ ┌────────────────────────────┐││││││││││││││
│  │   Payment           │ │   Invoice             │ │   Notification             ││││││││││││││
│  │─────────────────────│ │──────────────────────│ │────────────────────────────││││││││││││││
│  │ id (PK)             │ │ id (PK)              │ │ id (PK)                    ││││││││││││││
│  │ orderId (FK, UNQ)   │ │ companyId (FK)       │ │ userId (FK, onDelete Cas)  ││││││││││││││
│  │ companyId (FK)      │ │ clientId (FK)        │ │ type (NotificationType)    ││││││││││││││
│  │ clientId (FK)       │ │ orderId? (@unique)   │ │ title                      ││││││││││││││
│  │ method (PaymentMethod)│ │ paymentId? (@unique)│ │ message                    ││││││││││││││
│  │ status              │ │ addressId? (FK)      │ │ data (JSON?)               ││││││││││││││
│  │ invoice (1:1?)      │ │ fiscalData (JSON?)   │ │ read Boolean               ││││││││││││││
│  │ @@map               │ │ ─────────────────────│ │ @@map                      ││││││││││││││
│  └─────────────────────┘ │ createdById (FK→User)│ └────────────────────────────┘││││││││││││││
│                          │ @@unique([companyId, invNumber])                     ││││││││││││││
│                          └──────────────────────────────────────────────────────┘││││││││││││││
│                                                                                    ││││││││││││││
│  ┌────────────────┐ ┌────────────────────┐ ┌──────────────────┐ ┌─────────────┐││││││││││││││
│  │ PurchaseOrder  │ │ PurchaseOrderItem  │ │  UploadedFile    │ │ AuditLog    ││││││││││││││
│  │────────────────│ │────────────────────│ │──────────────────│ │─────────────││││││││││││││
│  │ id (PK)        │ │ id (PK)            │ │ id (PK)          │ │ id (PK)     ││││││││││││││
│  │ companyId (FK) │ │ purchaseOrderId(FK)│ │ name             │ │ action      ││││││││││││││
│  │ supplierId (FK)│ │ productVariantId?  │ │ originalName     │ │ entityType  ││││││││││││││
│  │ poNumber (UNQ) │ │ materialId? (FK)   │ │ mimeType         │ │ entityId    ││││││││││││││
│  │ status         │ │ quantity           │ │ size (Int)       │ │ actorId(FK) ││││││││││││││
│  │ items[]        │ │ unitCost           │ │ url              │ │ actorRole?  ││││││││││││││
│  │ @@unique([comp │ │ totalCost          │ │ thumbnailUrl?    │ │ metadata?   ││││││││││││││
│  │  panyId,poNum) │ │ receivedQty        │ │ fileType         │ │ ipAddress   ││││││││││││││
│  │                │ │ @@map              │ │ uploadedById(FK) │ │ userAgent   ││││││││││││││
│  └────────────────┘ └────────────────────┘ │ uploadedFor?     │ │ userAgent   ││││││││││││││
│                                             │ @@map            │ │ createdAt   ││││││││││││││
│                                             └──────────────────┘ │ actor(FK)   ││││││││││││││
│                                                                   │ @@index(es- ││││││││││││││
│                                                                   │ tityType,en ││││││││││││││
│                                                                   │ tityId)     ││││││││││││││
│                                                                   │ (actorId)   ││││││││││││││
│                                                                   │ (createdAt) ││││││││││││││
│                                                                   └─────────────┘││││││││││││││
│                                                                                    ││││││││││││││
│  ┌────────────────────────┐ ┌──────────────────────────────┐                       ││││││││││││││
│  │ Inventory              │ │  InventoryMovement           │                       ││││││││││││││
│  │────────────────────────│ │──────────────────────────────│                       ││││││││││││││
│  │ id (PK)                │ │ id (PK)                      │                       ││││││││││││││
│  │ companyId (FK)         │ │ inventoryId (FK,onDelete Cas)│                       ││││││││││││││
│  │ productVariantId? (FK) │ │ type (InventoryMovementType) │                       ││││││││││││││
│  │ materialId? (FK)       │ │ quantity                     │                       ││││││││││││││
│  │ branchId? (FK)         │ │ referenceId?                 │                       ││││││││││││││
│  │ quantity               │ │ referenceType?               │                       ││││││││││││││
│  │ reserved               │ │ createdById? (FK)            │                       ││││││││││││││
│  │ minStock               │ │ createdAt                    │                       ││││││││││││││
│  │ @@unique([companyId,   │ └──────────────────────────────┘                      ││││││││││││││
│  │  productVariantId)     │  ────────────────                                      ││││││││││││││
│  │ @@unique([companyId,   │   Product → inventories[] (1:N)                       ││││││││││││││
│  │  materialId)           │   Inventory → movements[] (1:N)                        ││││││││││││││
│  │ └──────────────────────┘                                                      ││││││││││││││
│  └────────────────────────┘                                                        ││││││││││││││
│                                                                                    ││││││││││││││
│  ═══════════════  CONFIGURACIÓN  ═══════════════                                   ││││││││││││││
│                                                                                    ││││││││││││││
│  ┌─────────────────────────────┐           ┌──────────────────────────────┐      ││││││││││││││
│  │   SystemConfig              │           │    CompanySetting            │      ││││││││││││││
│  │─────────────────────────────│           │──────────────────────────────│      ││││││││││││││
│  │ id (PK)                     │           │ id (PK)                      │      ││││││││││││││
│  │ key (UNQ)                   │           │ companyId (FK, onDelete Cas) │      ││││││││││││││
│  │ value (JSON)                │           │ key                          │      ││││││││││││││
│  │ updatedAt                   │           │ value (JSON)                 │      ││││││││││││││
│  │                             │           │ @@unique([companyId, key])   │      ││││││││││││││
│  └─────────────────────────────┘           └──────────────────────────────┘      ││││││││││││││
│                                                                                    ││││││││││││││
└────────────────────────────────────────────────────────────────────────────────────┘││││││││││││││
   LEYENDA:                                                                           ││││││││││││││
   ───→ = Relación 1:N   ◄──1 = Relación N:1 (inversa)                              ││││││││││││││
   (PK) = Clave Primaria   (UNQ) = Único   (FK) = Clave Foránea                     ││││││││││││││
   CASCADE = Eliminación en cascada                                                    ││││││││││││││
```

---

## 4. Resumen de hallazgos críticos

### 🔴 Críticos (deben resolverse antes de producción)

| # | Issue | Modelo | Impacto |
|---|-------|--------|---------|
| 1 | `ProductionJob.companyId` FK a Company sin relación Prisma declarada | `ProductionJob` | Sin enforcement en DB — datos inconsistentes posibles |
| 2 | `UploadedFile` carece de `companyId` — archivos de todas las empresas en una tabla | `UploadedFile` | Fuga de datos multitenancy + rendimiento O(n) |
| 3 | `AuditLog` no tiene `companyId` — logs globales sin aislamiento de tenant | `AuditLog` | Imposible filtrar auditoría por empresa eficientemente |

### 🟠 Altos (deberían resolverse antes de escalar)

| # | Issue | Modelo(s) | Impacto |
|---|-------|-----------|---------|
| 4 | Sin índice en `companyId` de `Customer` | `Customer` | Performance degradada conforme crecen clientes |
| 5 | Sin índice en `inventoryId` de `InventoryMovement` | `InventoryMovement` | Queries de historial de inventario lentas |
| 6 | Sin índices compuestos para queries frecuentes (dashboard/reportes) | `Order`, `Payment`, `Invoice`, `Shipment` | Dashboard lento con datos |
| 7 | `Notification` sin índice `(userId, read, createdAt)` | `Notification` | Notificaciones lentas al cargar |
| 8 | `Address` modelo compartido entre Customer/Company/Shipment — acoplamiento fuerte | `Address` | Cambios en dirección afectan múltiples contextos |
| 9 | `fiscalData` como JSON no queryable eficientemente | `Invoice` | Reporting fiscal lento |

### 🟡 Medios (mejoras de diseño)

| # | Issue | Modelo(s) | Impacto |
|---|-------|-----------|---------|
| 10 | `totalPrice` redundante en `OrderItem` y `QuoteItem` | Ambos | Riesgo de inconsistencia entre `quantity * unitPrice` y `totalPrice` |
| 11 | `Category` tree con `parentId` — limitado para árboles profundos | `Category` | Para catálogos grandes, considerar closure table |
| 12 | `Address.country` hardcodeo "AR" | `Address` | No internacionalizable sin migración |
| 13 | Sin `deletedAt` en modelos con `isActive` — incompleto soft delete | Varios | No se puede recuperar datos de soft delete |
| 14 | Sin `paymentId` reference en `Invoice` que permita múltiples pagos parciales | `Invoice`/`Payment` | Solo 1 pago por factura (1:1) |

---

## 5. Evaluación de buenas prácticas de Prisma

| Práctica | Cumplimiento | Notas |
|----------|:--:|-------|
| CUID como PK | ✅ | Consistente en todos los modelos |
| `@map()` para nombres de tabla | ✅ | Presente en todos los modelos |
| `@@map()` en modelo | ✅ | Consistente para nombres de tabla en DB |
| `@updatedAt` en todos los modelos | ✅ | Todos los modelos lo tienen |
| `createdAt` con `@default(now())` | ✅ | Consistente |
| Enums en lugar de strings | ✅ | 19 enums bien definidos |
| `Json` para datos flexibles | ✅ | `settings`, `fiscalData`, `customization`, `attributes` |
| Relaciones con `onDelete: Cascade` | ✅ | Donde es apropiado (tenant→children, order→items) |
| `@@unique` para slugs | ✅ | Company slug, Category slug, Quote slug, Order number |
| Sin `url` en datasource (Prisma v7) | ✅ | Compatible con Prisma v7 |
| `@db.Text` para tokens largos | ✅ | En Account model |
| Composite unique IDs | ✅ | `VerificationToken`, `CustomerAddress`, `CompanyAddress`, `RolePermission` |
| Índices explícitos | ⚠️ Parcial | AuditLog tiene 3 índices. Falta en Customer, Inventory, InventoryMovement, Payment, Invoice, Order, Shipment, Notification |
| FKs con índices explícitos | ⚠️ Parcial | Prisma crea índices FK implícitos, pero no siempre en columnas compuestas |

---

## 6. Cálculo de crecimiento estimado

| Tabla | Crecimiento | 1 año (1000 empresas) | 5 años |
|-------|:--:|:--:|:--:|
| User | 10/día | 36,500 | 182,500 |
| Order | 50/día | 18,250 | 91,250 |
| OrderItem | 5 por order | 91,250 | 456,250** |
| InventoryMovement | 3 por order | 54,750 | 273,750** |
| AuditLog | 100/día (est.) | 365,000 | 1,825,000 |
| Notification | 10/día | 36,500 | 182,500 |
| Inventory | 500 (stock entries) | 500 | 500 |
| Category | 20 | 20 | 20 |
| Material | 50 | 50 | 50 |
| PrintingTechnique | 10 | 10 | 10 |
| Supplier | 5 | 5 | 5 |
| Address | 200 | 200 | 200 |

**Total aproximado de filas en 1 año: ~** 500,000+. En 5 años: ~**3M+** filas. Esto requiere partitioning (AuditLog, InventoryMovement) e índices compuestos (Customer.companyId, Inventory.inventoryId) para mantener rendimiento.

---

## 7. Conclusión

El esquema actual demuestra un **diseño sólido para Fase 1**. Los modelos están bien normalizados, los enums son completos y los patrones de acceso más frecuentes (Auth.js, multitenancy por slug y CUID PKs) están correctamente implementados.

Los **3 temas críticos** que deben resolverse antes de llevar a producción son:
1. **`UploadedFile`** — agregar `companyId` para aislamiento multitenancy correcto
2. **`ProductionJob`** — `companyId` FK huérfana (sin relación Prisma declarada)
3. **Índices faltantes** en `Customer.companyId`, `InventoryMovement.inventoryId`, `Notification.userId` y los índices compuestos para queries de dashboard

Los **14 temas de mejora** identificados pueden abordarse durante Fases 2-3 sin riesgo de breaking changes, ya que la mayoría son adiciones no destructivas (nuevos campos, nuevos índices).