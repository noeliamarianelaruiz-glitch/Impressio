# Health Check de Base de Datos - Impressio

Este documento registra el estado de la conexión a la base de datos, Prisma y las migraciones.

---

## Información general

| Campo | Valor |
|---|---|
| Proyecto | Impressio |
| Proveedor de BD | PostgreSQL via Supabase |
| ORM | Prisma 7.9.1 |
| Schema | `prisma/schema.prisma` |
| Cliente generado | `src/generated/prisma/` |

---

## Estado de la conexión

| Indicador | Estado |
|---|---|
| `DATABASE_URL` configurada | **Pendiente** — No se ha encontrado `.env.local` con `DATABASE_URL`. |
| Conexión a Supabase | **Pendiente** — Requiere `DATABASE_URL` válida. |
| SSL habilitado | **Pendiente** — Verificar que la URL incluye `?sslmode=require`. |
| IP autorizada en Supabase | **Pendiente** — Verificar en Dashboard > Project Settings > Database > IP Addresses. |

---

## Estado de Prisma

| Indicador | Estado |
|---|---|
| Prisma instalado | **Correcto** — `prisma@7.9.1` presente en `package.json`. |
| `prisma/schema.prisma` | **Existe** — Schema completo con proveedor `postgresql`. |
| `datasource db.provider` | `postgresql` |
| `generator client.output` | `src/generated/prisma` |
| Prisma Client generado | **Pendiente** — Ejecutar `prisma generate` tras configurar `DATABASE_URL`. |

---

## Estado de las migraciones

| Indicador | Estado |
|---|---|
| Migraciones Prisma (`prisma/migrations/`) | **No aplicadas** — No existe carpeta de migraciones Prisma (hay archivos `.sql` sueltos en `migrations/` que no son gestionados por Prisma). |
| `prisma migrate dev --name init` | **Pendiente** — Se ejecutará tras configurar `DATABASE_URL`. |
| Migraciones SQL manuales existentes | Los archivos `migrations/001_trigram_search.sql` a `005_fulltext_search.sql` existen pero no están integrados en el flujo de Prisma. |

---

## Estado del cliente Prisma

| Indicador | Estado |
|---|---|
| `@prisma/client` instalado | **Correcto** — Versión 7.9.1 en `package.json`. |
| `@auth/prisma-adapter` | **Correcto** — Versión 2.11.3. |
| Prisma Client generado | **Pendiente** — Ejecutar `prisma generate` tras configurar `DATABASE_URL`. |

---

## Posibles problemas detectados

1. **`DATABASE_URL` no configurada**: No existe archivo `.env.local`. Sin esta variable, Prisma no puede conectarse a la base de datos ni ejecutar migraciones.

2. **No hay migraciones Prisma**: El directorio `prisma/migrations/` no existe o está vacío. Los archivos SQL en `migrations/` son manuales y no están rastreados por Prisma. Se recomienda ejecutar `prisma migrate dev --name init` para generar la migración inicial y crear todas las tablas desde el schema.

3. **Prisma Client no generado**: El directorio `src/generated/prisma` no existe aún. Se creará al ejecutar `prisma generate`.

4. **Políticas RLS no configuradas**: El schema de Prisma no define Row Level Security. Si se usa Supabase con autenticación, se deberán configurar políticas RLS en Supabase Dashboard > Database > Policies.

5. **PowerShell execution policy**: El entorno actual tiene el execution policy en `Restricted`, lo que impide ejecutar `npx` y `npm` directamente. Para ejecutar Prisma, usar:
   ```
   node node_modules/prisma/build/index.js <comando>
   ```

---

## Checklist de verificación

- [ ] `DATABASE_URL` configurada en `.env.local`
- [ ] Conexión verificada con `prisma migrate status`
- [ ] Migración inicial ejecutada con `prisma migrate dev --name init`
- [ ] Prisma Client generado con `prisma generate`
- [ ] Tablas creadas verificadas en Prisma Studio
- [ ] Prisma Studio accesible en `http://localhost:5555`
- [ ] Commit y push realizados