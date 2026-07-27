# Arquitectura del Sistema - Impressio

## 1. Descripción general
Impressio está construida como una aplicación web moderna full-stack utilizando Next.js (App Router), TypeScript y Tailwind CSS, diseñada para ofrecer alta escalabilidad, rendimiento optimizado y una experiencia de usuario fluida.

## 2. Componentes Principales
- **Frontend (Client & Server Components):** Interfaz de usuario interactiva basada en React y componentes de shadcn/ui.
- **Capa de Aplicación (Next.js App Router):** Enrutamiento basado en carpetas, renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG/ISR).
- **Capa de Negocio y Datos (Server Actions / API Routes):** Lógica del lado del servidor ejecutada de manera segura sin necesidad de exponer APIs públicas innecesarias.
- **Capa de Persistencia (Prisma ORM + PostgreSQL):** Gestión robusta de modelos de datos relacionales y consultas tipadas.

## 3. Patrones de Diseño
- **Separación de responsabilidades:** División clara entre componentes UI, lógica de negocio (servicios/acciones) y acceso a datos.
- **Tipado estricto extremo:** Uso de TypeScript en todo el stack y validación de esquemas con Zod.
- **Componentes Modulares:** Estructura orientada a dominios y componentes reutilizables.
