# Diseño de Base de Datos - Impressio

## 1. Stack Tecnológico
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL
- **Migraciones:** Prisma Migrate

## 2. Modelos Principales (Esquema Conceptual)

### User (Usuarios)
- `id`: CUID / UUID (PK)
- `name`: String
- `email`: String (Unique)
- `passwordHash`: String
- `role`: Enum (ADMIN, CLIENT, VENDOR)
- `createdAt`, `updatedAt`

### Product (Productos / Artículos de Impresión)
- `id`: PK
- `title`: String
- `description`: String
- `basePrice`: Decimal
- `category`: String
- `images`: String[]
- `isActive`: Boolean

### Order (Pedidos)
- `id`: PK
- `userId`: FK (User)
- `totalAmount`: Decimal
- `status`: Enum (PENDING, PROCESSING, PRINTING, SHIPPED, COMPLETED, CANCELLED)
- `shippingAddress`: Json
- `createdAt`, `updatedAt`

### OrderItem (Detalle de Pedido)
- `id`: PK
- `orderId`: FK (Order)
- `productId`: FK (Product)
- `quantity`: Integer
- `customizationDetails`: Json
- `price`: Decimal
