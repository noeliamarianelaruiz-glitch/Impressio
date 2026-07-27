# Guías de Interfaz de Usuario (UI Guidelines) - Impressio

## 1. Sistema de Diseño
- **Framework CSS:** Tailwind CSS
- **Componentes:** shadcn/ui (basados en Radix UI)
- **Iconografía:** Lucide React

## 2. Paleta de Colores y Tipografía
- **Tipografía:** Geist (Sans y Mono) provista por Next.js por defecto.
- **Colores:** Sistema de modo dual (Claro / Oscuro) gestionado mediante variables CSS (`--background`, `--foreground`, `--primary`, etc.).

## 3. Accesibilidad (a11y)
- Contraste de color adecuado según pautas WCAG 2.1 AA.
- Uso correcto de etiquetas semánticas HTML y atributos ARIA en componentes interactivos personalizados.
- Soporte completo para navegación por teclado.

## 4. Diseño Responsivo
- Enfoque *Mobile-First*.
- Breakpoints estándar de Tailwind (`sm`, `md`, `lg`, `xl`, `2xl`).
- Pruebas en viewports móviles, tablets y escritorios.
