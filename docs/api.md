# Documentación de API y Server Actions - Impressio

## 1. Enfoque Arquitectónico
Impressio prioriza el uso de **Next.js Server Actions** para la comunicación directa entre los componentes del cliente y la lógica de servidor, garantizando seguridad, menor boilerplate y tipado automático de extremo a extremo. Para integraciones externas o webhooks, se utilizarán **Route Handlers** (`app/api/...`).

## 2. Convenciones de Server Actions
- Ubicados preferiblemente en `src/actions/` o junto a los dominios correspondientes.
- Deben retornar un objeto estandarizado con el siguiente formato:
  ```ts
  type ActionResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
  }
  ```
- Todos los datos de entrada deben validarse obligatoriamente con **Zod** antes de ser procesados.

## 3. Endpoints de Route Handlers (API Routes)
- `/api/webhooks/payments`: Procesamiento de pagos (Stripe / MercadoPago).
- `/api/upload`: Gestión de archivos subidos por los usuarios para impresión.
