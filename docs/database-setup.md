# Configuración de Base de Datos con Supabase - Impressio

## 1. ¿Por qué Supabase?

Impressio utiliza **Supabase PostgreSQL** como base de datos de producción. Supabase ofrece:

- PostgreSQL gestionado con escala automática
- Conexión segura con SSL obligatorio
- Dashboard integrado para administrar tablas, consultas SQL y autenticación
- APIs REST (PostgREST) y tiempo real (Supabase Realtime) disponibles como extensión futura

---

## 2. Crear un proyecto en Supabase

### Paso 1: Cuenta en Supabase

1. Accede a [https://supabase.com](https://supabase.com) y créate una cuenta gratuita.
2. Una vez dentro, haz clic en **New Project** (o "Nuevo Proyecto").

### Paso 2: Configurar el proyecto

| Campo | Valor recomendado |
|-------|-------------------|
| **Organization** | Tu organización de Supabase |
| **Name** | `Impressio` |
| **Database Password** | Genera una contraseña segura y guárdala (la necesitarás más adelante) |
| **Region** | Elige la región más cercana a tus usuarios |
| **Pricing Plan** | Free (para desarrollo); Upgrade cuando estés en producción |

3. Haz clic en **Create new project** y espera unos segundos mientras se provisiona la base de datos.

---

## 3. Obtener la cadena `DATABASE_URL`

### Opción A: URL de conexión directa (recomendada para desarrollo y migraciones)

1. Ve al **Dashboard** del proyecto.
2. Navega a **Project Settings** (icono de engranaje, en el panel lateral izquierdo).
3. Selecciona **Database** en el submenú.
4. En la sección **Connection string**, verás la URL de conexión directa con el siguiente formato:

```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

5. Copia esta URL y reemplaza los valores entre corchetes con tus datos reales:
   - `[project-ref]`: El identificador del proyecto (p. ej., `abc-xyz-123`)
   - `[password]`: La contraseña que elegiste al crear el proyecto

6. Añade el parámetro de SSL al final:

```
postgresql://postgres.abc-xyz-123:TuPassword123@db.abc-xyz-123.supabase.co:5432/postgres?sslmode=require
```

7. Establece este valor en la variable de entorno `DATABASE_URL`.

### Opción B: URL del Connection Pooler (recomendada para producción)

1. Desde la misma sección **Database** en Project Settings.
2. Abre la pestaña **Connection Pooler**.
3. Copia la URL del pooler con el formato:

```
postgresql://postgres.[project-ref]:[password]@aws-0.[region].pooler.supabase.com:6543/postgres?sslmode=require
```

4. Usa esta URL para conexiones en producción.

### Sintaxis de la URL

```
postgresql://<usuario>:<contraseña>@<host>:<puerto>/<base-de-datos>?sslmode=require
```

- **usuario**: Siempre `postgres` para el rol superusuario en Supabase
- **contraseña**: La contraseña del proyecto
- **host**: `db.[project-ref].supabase.co` (conexión directa) o `aws-0.[region].pooler.supabase.com` (pooler)
- **puerto**: `5432` (directa) o `6543` (pooler)
- **sslmode=require**: Obligatorio para conexiones seguras a Supabase

---

## 4. Configurar las variables de entorno

Copia el contenido de `.env.example` en un nuevo archivo `.env` o `.env.local` (este último ya está en `.gitignore` y no se sube al repositorio):

```bash
# Copia desde el archivo ejemplo
cp .env.example .env.local
```

Edita `.env.local` con tus valores reales:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.abc-xyz-123:TuPassword123@db.abc-xyz-123.supabase.co:5432/postgres?sslmode=require"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-una-cadena-larga-y-aleatoria"
```

---

## 5. Ejecutar las migraciones (cuando la base de datos esté lista)

Una vez que tengas `DATABASE_URL` configurada correctamente en tu archivo `.env` (o `.env.local`):

### Opción 1: Automigrar (desarrollo)

Crea las tablas directamente desde el esquema de Prisma sin generar un archivo de migración explícito:

```bash
npx prisma db push
```

Esto sincroniza el estado actual de `prisma/schema.prisma` con la base de datos Supabase. **Útil solo en desarrollo.**

### Opción 2: Migración explícita (recomendado para cualquier entorno)

Genera una migración versionada a partir del esquema actual:

```bash
npx prisma migrate dev --name init
```

Esto:
1. Crea un archivo SQL de migración en `prisma/migrations/`
2. Aplica la migración a la base de datos Supabase
3. Genera el Prisma Client actualizado

### Opción 3: Generar solo el cliente (sin aplicar migraciones)

Si solo necesitas regenerar el Prisma Client (por ejemplo, después de cambiar `schema.prisma`):

```bash
npx prisma generate
```

### Opción 4: Inspeccionar la base de datos

Abre Prisma Studio (interfaz visual de base de datos):

```bash
npx prisma studio
```

Abre el navegador en la URL indicada (generalmente `http://localhost:5555`) y consulta tus tablas directamente.

---

## 6. Modelo de migraciones

Las migraciones de Prisma se almacenan en `prisma/migrations/` y se versionan con nombres descriptivos. Ejemplo de estructura:

```
prisma/
├── migrations/
│   └── init/
│       └── migration.sql      ← SQL generado automáticamente
├── schema.prisma              ← Definición del esquema (fuente de verdad)
└── ...
```

**Buenas prácticas**:
- Nunca edites un archivo de migración que ya fue aplicado a producción.
- Para cambios futuros, ejecuta `npx prisma migrate dev --name <descripción>` en cada cambio de `schema.prisma`.
- Para producción, usa `npx prisma migrate deploy` (solo aplica migraciones pendientes sin resetear datos).

---

## 7. Próximos pasos después de configurar Supabase

- [ ] Ejecutar `npx prisma db push` o `npx prisma migrate dev --name init` para crear las tablas de Auth.js
- [ ] Definir los modelos de datos de Impressio en `prisma/schema.prisma` (ver `docs/database.md`)
- [ ] Ejecutar las migraciones de datos de negocio (users, companies, products, orders, etc.)
- [ ] Configurar Row Level Security (RLS) en Supabase para protección de datos por empresa
- [ ] Implementar conexiones de servidor (`@prisma/client`) con lógica de edge vs Node.js según el despliegue

---

## 8. Solución de problemas frecuentes

| Problema | Solución |
|----------|----------|
| `P1000` - No se puede conectar | Verifica que `DATABASE_URL` sea correcta y que el host no esté escrito mal |
| `P1003` - La base de datos no existe | Supabase siempre usa la base `postgres`. Asegúrate de que el nombre sea `postgres` |
| `P1012` - Error de validación del esquema | No defines `url` en `datasource` de `schema.prisma` (era Prisma v6). En Prisma v7, usa solo `provider` |
| Tiempo de conexión agotado | Verifica que tu IP esté autorizada en Supabase Dashboard → Database → IP Addresses |
| SSL error | Asegúrate de que la URL termine en `?sslmode=require` |