# ADR 001: Sistema de Arquitectura para Impressio

## Estado
Aceptado

## Contexto
Impressio necesita una arquitectura de sistema completa que sirva como referencia principal para todos los desarrolladores futuros. Se deben definir los 18 módulos de la plataforma, los principios de diseño, el flujo de comunicación entre módulos, la organización frontend y backend, la arquitectura de base de datos, las integraciones futuras y el roadmap técnico de 12 fases.

## Decisión
Se adopta la siguiente arquitectura:

### Stack tecnológico
- **Frontend:** Next.js 16 App Router + React Server Components + TypeScript + Tailwind CSS v4 + shadcn/ui.
- **Backend/API:** Next.js API Routes + Server Actions + Auth.js v5.
- **ORM:** Prisma v7 con PostgreSQL (Supabase).
- **Seguridad:** Auth.js v5 con JWT + RBAC + Zod validation + RLS en Supabase.
- **Despliegue:** Vercel (frontend) + Supabase (base de datos).

### Principios de diseño
1. **Clean Architecture:** Dependencias hacia adentro (Domain → Application → Infrastructure → Presentation).
2. **DDD Bounded Contexts:** Cada módulo es un contexto delimitado con su propio aggregate root.
3. **SOLID:** SRP por módulo, DIP vía interfaces de repositorio, ISP con Server Actions granulares.
4. **Multitenancy:** `companyId` en cada tabla transaccional; Row-Level Security en Supabase.
5. **Security by Design:** Authenticated by default, sanitización con Zod, CSRF nativo de Next.js.
6. **Pragmatismo:** Sin microservicios en Fase 1; modularidad alcanzada por carpetas y boundaries claras.

### Módulos (18 total)
Autenticación → Usuarios → Roles → Permisos (RBAC) → Empresas → Sucursales → Clientes → Direcciones → Catálogo → Productos → Categorías → Variantes → Materiales → Técnicas de impresión → Archivos del cliente → Presupuestos → Cotizador con IA → Pedidos → Producción → Inventario → Compras → Proveedores → Facturación → Pagos → Envíos → Notificaciones → Dashboard → Reportes → Configuración → Auditoría → API pública → Integraciones futuras.

### Orden de implementación
Fase 1: Infraestructura (completada) → Fase 2: Auth → Fase 3: DB → Fase 4: Admin → Fase 5: Clients → Fase 6: Products → Fase 7: Orders → Fase 8: Production → Fase 9: Billing → Fase 10: AI → Fase 11: Integrations → Fase 12: Optimization.

### Frontend architecture
Organización por feature: `app/` (rutas), `components/ui/` (shadcn), `components/features/` (por módulo), `features/` (unidades de funcionalidad), `hooks/`, `lib/` (core + db repositories), `types/`, `store/` (Zustand), `providers/` (context).

### Backend architecture
- **Route Handlers** solo para webhooks externos y APIs públicas.
- **Server Actions** como interfaz principal frontend↔backend.
- **Prisma** como ORM con singleton client en `src/lib/prisma.ts`.
- **Auth.js v5** con Prisma adapter y JWT strategy.
- **Middleware** para protección de rutas + rate limiting básico.
- Repository pattern en `src/lib/db/` por módulo.

### Base de datos
- PostgreSQL en Supabase con SSL obligatorio.
- CUIDs como PK (`@default(cuid())`).
- `companyId` en todas las tablas transaccionales para multitenancy.
- Sin soft deletes en Fase 1 (usar `isActive` + enum `status`).
- `@map("TableName")` para mantener nombres de tabla PascalCase singular.

### Seguridad
- RBAC con `can(user, resource, action)` en cada Server Action.
- Zod schemas para toda validación de entrada.
- CSRF manejado por Auth.js / Next.js.
- Rate limiting en middleware (429 Too Many Requests).
- Audit trail inmutable en `AuditLog`.
- Logs estructurados en JSON, sin datos sensibles.
- Archivos almacenados en Supabase Storage con presigned URLs con expiry corto.

### Integraciones futuras
Patrón provider abstraction con interfaz `IntegrationProvider` + factory en `src/lib/integrations/`. Cada integración (Stripe, MercadoPago, WhatsApp, OpenAI, Google Drive, S3, APIs de envío, facturación electrónica) se encapsula en su propio directorio.

## Consecuencias
- Las decisiones están documentadas y son auditablemente trazables.
- El equipo tiene una referencia única para la arquitectura del sistema.
- La implementación futura sigue fases lógicas que minimizan dependencias circulares.
- Los ADRs futuros pueden referenciar este como la decisión arquitectónica base.