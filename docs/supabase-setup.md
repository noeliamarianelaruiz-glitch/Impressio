# Guía de Configuración de Supabase para Impressio

Este documento explica paso a paso cómo conectar el proyecto Impressio con una base de datos PostgreSQL de Supabase.

---

## 1. Crear un proyecto en Supabase

1. Accede a [https://supabase.com](https://supabase.com) y créate una cuenta (o inicia sesión).
2. Haz clic en **New Project**.
3. Configura los campos:
   - **Organization**: Selecciona tu organización (o créala si es tu primer proyecto).
   - **Name**: `Impressio`.
   - **Database Password**: Genera una contraseña segura y guárdala en un lugar seguro. La necesitarás para la cadena de conexión.
   - **Region**: Selecciona la región más cercana a tus usuarios.
   - **Pricing Plan**: El plan **Free** es suficiente para desarrollo.
4. Haz clic en **Create new project** y espera unos segundos mientras Supabase provisiona la base de datos.

---

## 2. Obtener la `DATABASE_URL`

### 2.1 URL de conexión directa (recomendada para desarrollo)

1. Ve al **Dashboard** del proyecto recién creado.
2. En el menú lateral izquierdo, haz clic en **Project Settings** (icono de engranaje).
3. Selecciona **Database** en el submenú.
4. En la sección **Connection string**, copia la URL de conexión directa.
5. El formato es:

```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

6. Reemplaza los valores entre corchetes con tus datos reales:
   - `[project-ref]`: El identificador único de tu proyecto (p. ej., `abc-xyz-123`).
   - `[password]`: La contraseña que definiste al crear el proyecto.
7. Añade el parámetro de SSL al final:

```
postgresql://postgres.abc-xyz-123:TuPassword123@db.abc-xyz-123.supabase.co:5432/postgres?sslmode=require
```

### 2.2 URL del Connection Pooler (recomendada para producción)

1. Desde **Project Settings** > **Database**.
2. Abre la pestaña **Connection Pooler**.
3. Copia la URL del pooler con el formato:

```
postgresql://postgres.[project-ref]:[password]@aws-0.[region].pooler.supabase.com:6543/postgres?sslmode=require
```

### Sintaxis de la URL

```
postgresql://<usuario>:<contraseña>@<host>:<puerto>/<base-de-datos>?sslmode=require
```

| Componente | Valor |
|---|---|
| usuario | `postgres` |
| contraseña | La contraseña del proyecto |
| host | `db.[project-ref].supabase.co` (directa) o `aws-0.[region].pooler.supabase.com` (pooler) |
| puerto | `5432` (directa) o `6543` (pooler) |
| base-de-datos | `postgres` |
| sslmode | `require` (obligatorio para Supabase) |

---

## 3. Configurar el archivo `.env.local`

### 3.1 Crear el archivo

Copia el contenido de `.env.example` y pégalo en un nuevo archivo llamado `.env.local` en la raíz del proyecto:

```bash
copy .env.example .env.local
```

> **Nota**: `.env.local` ya está listado en `.gitignore`, por lo que nunca se subirá al repositorio.

### 3.2 Editar con tus valores

Abre `.env.local` y reemplaza la variable `DATABASE_URL` con la cadena que obtuviste en el paso 2:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.abc-xyz-123:TuPassword123@db.abc-xyz-123.supabase.co:5432/postgres?sslmode=require"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-una-cadena-larga-y-aleatoria-con-openssl-rand-base64"
```

Las demás variables (`GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, etc.) pueden dejarse vacías si no se usan OAuth externo.

### 3.3 Variables necesarias

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | **Sí** | Cadena de conexión a Supabase PostgreSQL |
| `NEXTAUTH_URL` | **Sí** | URL base de la aplicación (`http://localhost:3000` en desarrollo) |
| `NEXTAUTH_SECRET` | **Sí** | Secreto para firmar tokens de sesión (genera uno con `openssl rand -base64 32`) |
| `GITHUB_ID` | No | Client ID de GitHub OAuth |
| `GITHUB_SECRET` | No | Client Secret de GitHub OAuth |
| `GOOGLE_CLIENT_ID` | No | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Client Secret de Google OAuth |
| `EMAIL_SERVER_HOST` | No | Host del servidor de email |
| `EMAIL_SERVER_PORT` | No | Puerto del servidor de email |
| `EMAIL_SERVER_USER` | No | Usuario del servidor de email |
| `EMAIL_SERVER_PASSWORD` | No | Contraseña del servidor de email |
| `EMAIL_FROM` | No | Email remitente para notificaciones |

---

## 4. Comprobar la conexión

Una vez configurada `DATABASE_URL` en `.env.local`, verifica que Prisma puede conectarse a la base de datos:

### 4.1 Ejecutar `prisma migrate status`

```bash
node node_modules/prisma/build/index.js migrate status
```

Si la conexión es exitosa, verás información sobre el estado de las migraciones. Si hay un error, verifica:
- Que `DATABASE_URL` está escrita correctamente en `.env.local`.
- Que no hay errores tipográficos en el host o la contraseña.
- Que tu IP está autorizada en Supabase (Dashboard > Project Settings > Database > IP Addresses).
- Que el parámetro `?sslmode=require` está presente al final de la URL.

### 4.2 Abrir Prisma Studio

```bash
node node_modules/prisma/build/index.js studio
```

Esto abre una interfaz visual en `http://localhost:5555` donde puedes ver y consultar las tablas directamente. Si puede abrirse y mostrar las tablas, la conexión está funcionando.

---

## 5. Ejecutar Prisma correctamente

### Opción A: `prisma migrate dev` (recomendado para desarrollo)

Crea una migración versionada y la aplica a la base de datos:

```bash
node node_modules/prisma/build/index.js migrate dev --name init
```

Esto:
1. Genera un archivo SQL de migración en `prisma/migrations/init/`.
2. Aplica la migración a la base de datos Supabase.
3. Genera (o regenera) el Prisma Client en `src/generated/prisma/`.

> **Usa este comando cuando el esquema `prisma/schema.prisma` tenga cambios y quieras versionar las migraciones.**

### Opción B: `prisma db push` (solo desarrollo)

Sincroniza el estado actual del schema con la base de datos directamente, sin crear migraciones versionadas:

```bash
node node_modules/prisma/build/index.js db push
```

> **Usa `db push` únicamente en desarrollo cuando quieras aplicar cambios rápidamente sin crear un historial de migraciones.** No se recomienda para producción ni para bases de datos con datos existentes que no puedan perderse.

### Cuándo usar cada uno

| Comando | Cuándo usarlo |
|---|---|
| `prisma migrate dev --name init` | Primera vez que configuras la base de datos, o cuando quieres versionar cambios del schema |
| `prisma db push` | Durante el desarrollo activo cuando el schema cambia frecuentemente y no necesitas historial de migraciones |
| `prisma migrate deploy` | En producción para aplicar migraciones pendientes sin alterar datos |

### Opción C: Solo generar el cliente

Si el schema no ha cambiado pero necesitas regenerar el Prisma Client:

```bash
node node_modules/prisma/build/index.js generate
```

### Opción D: Inspeccionar la base de datos

Para abrir una interfaz visual y explorar los datos:

```bash
node node_modules/prisma/build/index.js studio
```

Se abre en `http://localhost:5555`.

---

## 6. Verificar que las tablas se crearon correctamente

Después de ejecutar las migraciones, verifica el estado:

```bash
node node_modules/prisma/build/index.js migrate status
```

Deberías ver un mensaje indicando que la última migración se aplicó correctamente (por ejemplo, `migration_list` o `database schema is up to date`).

Para verificar las tablas creadas, abre Prisma Studio y navega por las tablas, o ejecuta una consulta SQL directamente desde Supabase Dashboard > SQL Editor.

Las tablas esperadas del schema de Impressio incluyen:

- `User`, `Account`, `Session`, `VerificationToken` (Auth.js)
- `Permission`, `RolePermission` (RBAC)
- `Company`, `Branch` (Tenant/Organización)
- `Customer`, `Address` (CRM)
- `Category`, `Product`, `ProductVariant` (Catálogo)
- `Material`, `PrintingTechnique` (Producción)
- `Quote`, `QuoteItem` (Presupuestos)
- `Order`, `OrderItem` (Pedidos)
- `ProductionJob` (Órdenes de producción)
- `Inventory`, `InventoryMovement` (Inventario)
- `Supplier`, `PurchaseOrder`, `PurchaseOrderItem` (Compras)
- `Payment`, `Invoice`, `Shipment` (Finanzas y Logística)
- `Notification`, `UploadedFile`, `AuditLog` (Sistema)
- `CompanySetting`, `SystemConfig` (Configuración)

---

## 7. Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `P1000` - No se puede conectar | `DATABASE_URL` incorrecta | Verifica el formato completo de la URL, incluyendo `?sslmode=require` |
| `P1003` - La base de datos no existe | Nombre de base de datos incorrecto | Supabase siempre usa la base `postgres`, asegúrate de que el nombre final sea `/postgres` |
| `P1012` - Error de validación del schema | Falta `url` en `datasource` (Prisma v6) | En Prisma v7, solo se requiere `provider = "postgresql"` sin `url` en el schema |
| Timeout de conexión | IP no autorizada en Supabase | Ve a Dashboard > Project Settings > Database > IP Addresses y añade tu IP |
| SSL error | Falta `?sslmode=require` | Asegúrate de que la URL termina con `?sslmode=require` |
| `npx` no se reconoce | PowerShell execution policy | Usa `node node_modules/prisma/build/index.js <comando>` en lugar de `npx prisma <comando>` |