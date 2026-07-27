# Arquitectura de Base de Datos - Impressio

## 1. Visión general
La base de datos de Impressio se modela como un sistema relacional (PostgreSQL) gestionado mediante Prisma ORM. El diseño está orientado a soportar un flujo completo de impresión personalizada: desde la gestión de usuarios y empresas, pasando por la creación de productos con variantes personalizables, hasta el ciclo completo de pedidos, pagos, facturación, envíos y auditoría. También incluye un módulo de conversaciones con IA para asistencia al cliente y generación de contenido.

---

## 2. Entidades principales

### 2.1 Usuario (`User`)
Representa a cualquier persona registrada en la plataforma, ya sea cliente final, administrador o representante de una empresa.

| Campo         | Tipo     | Descripción                                               |
|---------------|----------|-----------------------------------------------------------|
| `id`          | CUID     | ID único global                                           |
| `email`       | String   | Correo electrónico (único)                               |
| `name`        | String   | Nombre completo                                           |
| `passwordHash`| String   | Hash de contraseña (bcrypt/scrypt)                        |
| `role`        | Enum     | Ver sección `Role`                                        |
| `image`       | String?  | URL de avatar                                             |
| `createdAt`   | DateTime | Fecha de creación                                         |
| `updatedAt`   | DateTime | Última actualización                                      |

**Relaciones:**
- `1 → 1` con `Profile`
- `1 → N` con `Order`
- `1 → N` con `Budget`
- `1 → N` con `Notification`
- `1 → N` con `AIChat` (como participante)
- `1 → N` con `AuditLog` (como usuario actor)

---

### 2.2 Rol (`Role`)
Enum con los valores: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CLIENT`, `VENDOR`. Define el nivel de acceso y permisos del usuario.

| Campo    | Tipo   | Descripción                            |
|----------|--------|----------------------------------------|
| `value`  | String | Valor del enum (clave única)           |
| `label`  | String | Etiqueta legible (p. ej., "Administrador") |

**Relaciones:**
- Los roles se almacenan como enum en `User.role` pero esta tabla de referencia permite futuras extensiones como descripciones de permisos por rol.

---

### 2.3 Permiso (`Permission`)
Define cada acción concreta que puede realizarse en el sistema. Los roles se asocian a permisos mediante una tabla intermedia `RolePermission`.

| Campo    | Tipo    | Descripción                            |
|----------|---------|----------------------------------------|
| `id`     | CUID    | ID único                               |
| `name`   | String  | Nombre técnico (p. ej., `order:create`)|
| `resource` | String| Recurso al que pertenece               |
| `action` | String  | Acción permitida (`create`, `read`, `update`, `delete`) |
| `description` | String? | Descripción legible                |

**Relaciones:**
- `N → N` con `Role` a través de `RolePermission`

---

### 2.4 Rol-Permiso (`RolePermission`)
Tabla intermedia que asigna permisos a roles.

| Campo        | Tipo   | Descripción                        |
|--------------|--------|------------------------------------|
| `role`       | String | FK → `User.role`                   |
| `permissionId` | CUID | FK → `Permission.id`               |

---

### 2.5 Empresa (`Company`)
Representa una organización que usa Impressio (negocio B2B, taller de impresión, etc.).

| Campo           | Tipo      | Descripción                                      |
|-----------------|-----------|--------------------------------------------------|
| `id`            | CUID      | ID único                                         |
| `name`          | String    | Nombre de la empresa                             |
| `slug`          | String    | Identificador URL único                          |
| `logo`          | String?   | URL del logo                                     |
| `address`       | Json?     | Datos de dirección (calle, ciudad, código posta) |
| `taxId`         | String?   | NIF / CUIT / RFC                                 |
| `phone`         | String?   | Teléfono de contacto                             |
| `website`       | String?   | Sitio web                                        |
| `createdAt`     | DateTime  | Fecha de creación                                |
| `updatedAt`     | DateTime  | Última actualización                             |

**Relaciones:**
- `1 → N` con `User` (usuarios de la empresa)
- `1 → N` con `Client`
- `1 → N` con `Product`
- `1 → N` con `Order`
- `1 → N` con `Budget`
- `1 → N` con `CompanySetting`

---

### 2.6 Cliente (`Client`)
Persona o empresa que compra productos de impresión como cliente final.

| Campo          | Tipo      | Descripción                                      |
|----------------|-----------|--------------------------------------------------|
| `id`           | CUID      | ID único                                         |
| `name`         | String    | Nombre o razón social                            |
| `email`        | String?   | Correo electrónico de contacto                   |
| `phone`        | String?   | Teléfono                                         |
| `documentId`   | String?   | Documento de identidad (DNI, NIF, RFC)           |
| `address`      | Json?     | Dirección de envío principal                     |
| `companyId`    | CUID?     | FK → `Company.id` (opcional, para clientes B2B)  |
| `notes`        | String?   | Notas internas                                   |
| `createdAt`    | DateTime  | Fecha de creación                                |
| `updatedAt`    | DateTime  | Última actualización                             |

**Relaciones:**
- `N → 1` con `Company`
- `1 → N` con `Order`
- `1 → N` con `Budget`
- `1 → N` con `Invoice`
- `1 → N` con `Shipment`

---

### 2.7 Categoría (`Category`)
Taxonomía para organizar los productos de impresión.

| Campo       | Tipo    | Descripción                          |
|-------------|---------|--------------------------------------|
| `id`        | CUID    | ID único                             |
| `name`      | String  | Nombre (p. ej., "Camisetas", "Llaveros") |
| `slug`      | String  | Identificador URL único              |
| `parentId`  | CUID?   | FK auto-referencia para categorías anidadas |
| `icon`      | String? | Icono representativo                 |
| `sortOrder` | Int     | Orden de visualización               |
| `createdAt` | DateTime| Fecha de creación                    |
| `updatedAt` | DateTime| Última actualización                 |

**Relaciones:**
- `N → 1` con `Category` (subcategorías)
- `1 → N` con `Product`

---

### 2.8 Producto (`Product`)
Artículo de impresión disponible para compra, con opciones de personalización.

| Campo           | Tipo      | Descripción                                            |
|-----------------|-----------|--------------------------------------------------------|
| `id`            | CUID      | ID único                                               |
| `name`          | String    | Nombre del producto                                    |
| `slug`          | String    | Identificador URL único                                |
| `description`   | String?   | Descripción detallada                                  |
| `basePrice`     | Decimal   | Precio base                                            |
| `currency`      | String    | Moneda (p. ej., "ARS", "USD")                          |
| `categoryId`    | CUID?     | FK → `Category.id`                                     |
| `companyId`     | CUID      | FK → `Company.id`                                      |
| `images`        | String[]  | URLs de imágenes del producto                          |
| `isActive`      | Boolean   | Si el producto está disponible                         |
| `sortOrder`     | Int       | Orden de visualización                                 |
| `createdAt`     | DateTime  | Fecha de creación                                      |
| `updatedAt`     | DateTime  | Última actualización                                   |

**Relaciones:**
- `N → 1` con `Category`
- `N → 1` con `Company`
- `1 → N` con `ProductVariant`
- `1 → N` con `OrderItem`
- `1 → N` con `BudgetItem`

---

### 2.9 Variante de Producto (`ProductVariant`)
Cada variante representa una combinación específica del producto (talla, color, material, acabado).

| Campo          | Tipo      | Descripción                                       |
|----------------|-----------|---------------------------------------------------|
| `id`           | CUID      | ID único                                          |
| `productId`    | CUID      | FK → `Product.id`                                 |
| `name`         | String    | Nombre de la variante (p. ej., "Rojo / S")        |
| `sku`          | String?   | Código de stock único                             |
| `price`        | Decimal?  | Precio específico (null = usa Product.basePrice)  |
| `attributes`   | Json      | Atributos clave-valor (talla, color, material)     |
| `isActive`     | Boolean   | Si la variante está disponible                     |
| `sortOrder`    | Int       | Orden de visualización                             |
| `createdAt`    | DateTime  | Fecha de creación                                 |
| `updatedAt`    | DateTime  | Última actualización                              |

**Relaciones:**
- `N → 1` con `Product`
- `1 → N` con `OrderItem`
- `1 → N` con `BudgetItem`

---

### 2.10 Presupuesto (`Budget`)
Un presupuesto (cotización) generado para un cliente antes de convertirse en pedido.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `slug`          | String    | Identificador URL único (ej: "presupuesto-abc123")  |
| `clientId`      | CUID      | FK → `Client.id`                                    |
| `companyId`     | CUID      | FK → `Company.id`                                   |
| `userId`        | CUID      | FK → `User.id` (creador)                           |
| `status`        | Enum      | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED            |
| `subtotal`      | Decimal   | Subtotal sin impuestos                              |
| `taxRate`       | Decimal?  | Tasa de impuesto (%)                                |
| `taxAmount`     | Decimal?  | Monto de impuestos                                  |
| `totalAmount`   | Decimal   | Total con impuestos                                 |
| `currency`      | String    | Moneda                                              |
| `validUntil`    | DateTime? | Fecha de expiración                                 |
| `notes`         | String?   | Observaciones                                       |
| `createdAt`     | DateTime  | Fecha de creación                                   |
| `updatedAt`     | DateTime  | Última actualización                                |

**Relaciones:**
- `N → 1` con `Client`
- `N → 1` con `Company`
- `N → 1` con `User`
- `1 → N` con `BudgetItem`
- `1 → 1` con `Order` (solo si se convierte en pedido)

---

### 2.11 Ítem de Presupuesto (`BudgetItem`)
Línea individual dentro de un presupuesto.

| Campo           | Tipo      | Descripción                                      |
|-----------------|-----------|--------------------------------------------------|
| `id`            | CUID      | ID único                                         |
| `budgetId`      | CUID      | FK → `Budget.id`                                 |
| `productVariantId` | CUID?  | FK → `ProductVariant.id` (opcional)              |
| `productName`   | String?   | Nombre del producto (referencia si no hay variante) |
| `quantity`      | Int       | Cantidad                                         |
| `unitPrice`     | Decimal   | Precio unitario                                  |
| `customization` | Json?     | Detalles de personalización                      |
| `notes`         | String?   | Notas específicas del ítem                       |
| `sortOrder`     | Int       | Orden de las líneas                              |

---

### 2.12 Pedido (`Order`)
Pedido confirmado por el cliente.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `orderNumber`   | String    | Número de orden legible (autogenerado)              |
| `clientId`      | CUID      | FK → `Client.id`                                    |
| `companyId`     | CUID      | FK → `Company.id`                                   |
| `userId`        | CUID      | FK → `User.id` (creador)                           |
| `status`        | Enum      | PENDING, CONFIRMED, IN_PRODUCTION, PRINTING, READY, SHIPPED, DELIVERED, CANCELLED |
| `subtotal`      | Decimal   | Subtotal                                            |
| `taxRate`       | Decimal?  | Tasa de impuesto (%)                                |
| `taxAmount`     | Decimal?  | Monto de impuestos                                  |
| `totalAmount`   | Decimal   | Total con impuestos                                 |
| `currency`      | String    | Moneda                                              |
| `shippingAddress` | Json?   | Dirección de envío específica de este pedido        |
| `notes`         | String?   | Notas internas                                      |
| `createdAt`     | DateTime  | Fecha de creación                                   |
| `updatedAt`     | DateTime  | Última actualización                                |

**Relaciones:**
- `N → 1` con `Client`
- `N → 1` con `Company`
- `N → 1` con `User`
- `1 → N` con `OrderItem`
- `1 → 1` con `Payment`
- `1 → 1` con `Invoice`
- `1 → 1` con `Shipment`

---

### 2.13 Ítem de Pedido (`OrderItem`)
Línea individual dentro del pedido, referencia a variante de producto y cantidad personalizada.

| Campo           | Tipo      | Descripción                                      |
|-----------------|-----------|--------------------------------------------------|
| `id`            | CUID      | ID único                                         |
| `orderId`       | CUID      | FK → `Order.id`                                  |
| `productVariantId` | CUID?  | FK → `ProductVariant.id`                         |
| `productName`   | String?   | Nombre del producto (referencia)                  |
| `quantity`      | Int       | Cantidad                                         |
| `unitPrice`     | Decimal   | Precio unitario                                  |
| `totalPrice`    | Decimal   | Precio total (quantity × unitPrice)              |
| `customization` | Json?     | Detalles de personalización                      |
| `notes`         | String?   | Notas específicas                                |
| `sortOrder`     | Int       | Orden de las líneas                              |

---

### 2.14 Pago (`Payment`)
Registro de cada transacción de pago asociada a un pedido.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `orderId`       | CUID      | FK → `Order.id`                                     |
| `clientId`      | CUID      | FK → `Client.id`                                    |
| `method`        | Enum      | CASH, TRANSFER, CARD, STRIPE, MERCADOPAGO, OTHER   |
| `status`        | Enum      | PENDING, COMPLETED, FAILED, REFUNDED                |
| `amount`        | Decimal   | Monto del pago                                      |
| `currency`      | String    | Moneda                                              |
| `transactionId` | String?   | ID de transacción del proveedor de pagos            |
| `reference`     | String?   | Número de referencia bancaria/comprobante          |
| `paidAt`        | DateTime? | Fecha y hora del pago                               |
| `notes`         | String?   | Notas adicionales                                   |
| `createdAt`     | DateTime  | Fecha de creación                                   |

**Relaciones:**
- `N → 1` con `Order`
- `N → 1` con `Client`

---

### 2.15 Factura (`Invoice`)
Factura emitida para un pedido, cubriendo requisitos fiscales.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `invoiceNumber` | String    | Número de factura (autogenerado)                    |
| `orderId`       | CUID      | FK → `Order.id`                                     |
| `clientId`      | CUID      | FK → `Client.id`                                    |
| `companyId`     | CUID      | FK → `Company.id`                                   |
| `issueDate`     | DateTime  | Fecha de emisión                                    |
| `dueDate`       | DateTime? | Fecha de vencimiento                                |
| `status`        | Enum      | DRAFT, ISSUED, PAID, OVERDUE, CANCELLED             |
| `subtotal`      | Decimal   | Subtotal                                            |
| `taxRate`       | Decimal?  | Tasa de impuesto                                    |
| `taxAmount`     | Decimal?  | Monto de impuestos                                  |
| `totalAmount`   | Decimal   | Total con impuestos                                 |
| `currency`      | String    | Moneda                                              |
| `notes`         | String?   | Observaciones                                       |
| `createdAt`     | DateTime  | Fecha de creación                                   |
| `updatedAt`     | DateTime  | Última actualización                                |

**Relaciones:**
- `N → 1` con `Order`
- `N → 1` con `Client`
- `N → 1` con `Company`

---

### 2.16 Envío (`Shipment`)
Registro de envío/entrega de un pedido.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `orderId`       | CUID      | FK → `Order.id`                                     |
| `carrier`       | String?   | Nombre del servicio de envío (Correo, DHL, etc.)   |
| `trackingNumber`| String?   | Número de tracking                                  |
| `carrierUrl`    | String?   | URL de rastreo del carrier                         |
| `status`        | Enum      | PENDING, SHIPPED, IN_TRANSIT, DELIVERED, RETURNED  |
| `shippedAt`     | DateTime? | Fecha de envío                                      |
| `deliveredAt`   | DateTime? | Fecha de entrega                                    |
| `shippingAddress`| Json     | Dirección de destino                                |
| `notes`         | String?   | Notas adicionales                                   |
| `createdAt`     | DateTime  | Fecha de creación                                   |

**Relaciones:**
- `N → 1` con `Order`

---

### 2.17 Archivo (`File`)
Archivos subidos por usuarios (diseños, imágenes, documentos de personalización).

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `name`          | String    | Nombre original del archivo                         |
| `originalName`  | String    | Nombre original tal como se subió                   |
| `mimeType`      | String    | Tipo MIME (image/png, application/pdf, etc.)       |
| `size`          | Int       | Tamaño en bytes                                     |
| `url`           | String    | URL de almacenamiento (S3, local, etc.)            |
| `thumbnailUrl`  | String?   | URL del thumbnail generado                          |
| `uploadedBy`    | CUID      | FK → `User.id`                                      |
| `uploadedFor`   | CUID?     | ID del recurso relacionado (orderId, budgetId, etc.)|
| `uploadedForType`| String?  | Tipo de recurso ("order", "budget", "product")      |
| `createdAt`     | DateTime  | Fecha de subida                                     |

**Relaciones:**
- `N → 1` con `User`

---

### 2.18 Notificación (`Notification`)
Notificaciones internas para usuarios del sistema.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `userId`        | CUID      | FK → `User.id` (destinatario)                      |
| `type`          | Enum      | ORDER_UPDATE, PAYMENT_RECEIVED, BUDGET_EXPIRED, SYSTEM, AI_SUMMARY|
| `title`         | String    | Título corto de la notificación                     |
| `message`       | String    | Contenido de la notificación                        |
| `data`          | Json?     | Datos de referencia (orderId, etc.)                 |
| `read`          | Boolean   | Si fue leída                                        |
| `readAt`        | DateTime? | Cuándo fue leída                                    |
| `createdAt`     | DateTime  | Fecha de creación                                   |

**Relaciones:**
- `N → 1` con `User`

---

### 2.19 Conversación con IA (`AIChat`)
Almacena conversaciones e interacciones con inteligencia artificial para asistencia al cliente o generación de contenido.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `title`         | String?   | Título generado automáticamente                     |
| `participantId` | CUID?     | FK → `User.id` (cliente o usuario)                 |
| `context`       | Json?     | Contexto de la conversación (producto, presupuesto) |
| `status`        | Enum      | ACTIVE, ARCHIVED, CLOSED                           |
| `model`         | String?   | Modelo de IA utilizado                              |
| `tokensUsed`    | Int?      | Token count estimado                                |
| `createdAt`     | DateTime  | Fecha de creación                                   |
| `updatedAt`     | DateTime  | Última actualización                                |

**Relaciones:**
- `N → 1` con `User` (participante)
- `1 → N` con `AIMessage`

---

### 2.20 Mensaje de IA (`AIMessage`)
Mensajes individuales dentro de una conversación con IA.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `aiChatId`      | CUID      | FK → `AIChat.id`                                   |
| `role`          | Enum      | user, assistant, system                             |
| `content`       | String    | Contenido del mensaje                               |
| `metadata`      | Json?     | Datos adicionales (tokens, model metadata)          |
| `createdAt`     | DateTime  | Fecha del mensaje                                   |

**Relaciones:**
- `N → 1` con `AIChat`

---

### 2.21 Registro de Auditoría (`AuditLog`)
Log inmutable que registra todas las acciones significativas del sistema para cumplimiento y trazabilidad.

| Campo           | Tipo      | Descripción                                         |
|-----------------|-----------|-----------------------------------------------------|
| `id`            | CUID      | ID único                                            |
| `action`        | String    | Descripción de la acción (p. ej., "order.created")  |
| `entityType`    | String    | Tipo de entidad afectada ("Order", "User", etc.)    |
| `entityId`      | String?   | ID de la entidad afectada                           |
| `actorId`       | CUID?     | FK → `User.id` (quién realizó la acción)           |
| `actorRole`     | String?   | Rol del actor en el momento de la acción            |
| `metadata`      | Json?     | Datos adicionales relevantes                        |
| `ipAddress`     | String?   | IP del cliente que realizó la acción               |
| `userAgent`     | String?   | User agent del navegador                            |
| `createdAt`     | DateTime  | Fecha y hora del evento                             |

---

## 3. Diagrama de relaciones (resumen)

```
Company ──┬─── User (empleados)
          ├─── Client
          ├─── Product ── ProductVariant ── OrderItem ── Order
          │                                    └── BudgetItem ── Budget
          ├─── Order ── Payment
          │         ├── Invoice
          │         └── Shipment
          └─── Budget ── BudgetItem
                   └── Order (convertido)

Client ──┬── Order ── Payment
          ├── Invoice
          └── Shipment

User ──── Order (creador)
       ├── Budget (creador)
       ├── Notification
       └── AIChat ── AIMessage

File ──── Usuario (uploader)

AuditLog ─ Usuario (actor)
```

---

## 4. Principios de diseño

1. **Auditabilidad**: Toda creación/actualización/eliminación relevante se registra en `AuditLog`.
2. **Trazabilidad**: `orderNumber`, `invoiceNumber` y `slug` son identificadores únicos legibles por humanos.
3. **Internacionalización**: Toda entidad monetaria incluye `currency` explícito.
4. **Flexibilidad de personalización**: `OrderItem.customization` y `BudgetItem.customization` almacenan datos estructurados como JSON para adaptarse a cualquier tipo de producto.
5. **Separación de roles**: Los permisos granulares se definen en `Permission` y se asignan a `Role` mediante `RolePermission`.
6. **Privacidad**: Los datos sensibles (contraseñas, documentos de identidad) se almacenan hasheados o encriptados. Los campos `.env` nunca se commiten al repositorio.
7. **Prisma v7 compatibilidad**: El `schema.prisma` es compatible con Prisma v7 (sin `url` en datasource, configuración en `prisma.config.ts`).