# Graciano · Demo

Tienda de presentación en React 19, Vite 8, TypeScript estricto, React Router 7 y styled-components 6. Los estilos base de la demo se importan de `referencia/`. Los activos que usa React están en `public/assets/`.

## Ejecutar

Usá Node.js 24 y pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

La tienda está en `/` y el panel en `/admin`. Para mostrar el faltante, agregá Catena Malbec y abrí el carrito. Se inicia con retiro en Ituzaingó 1167 y hay stock de ejemplo en las otras sucursales. Podés cambiar a Obispo Trejo 1119 para seguir con la compra.

## Publicar la demo

- **Vercel.** Importá el repositorio con la plantilla Vite y usá Node.js 24. El comando de build es `pnpm build` y la salida es `dist`. La configuración incluida sirve la ruta `/admin` al abrirla directamente. Para una presentación comercial, usá un equipo habilitado para ese uso. [Planes y uso comercial](https://vercel.com/docs/limits/fair-use-guidelines)
- **Cloudflare Pages.** Subí la carpeta `dist` o el ZIP del build por Direct Upload desde el panel. Si conectás Git, usá `pnpm build` con salida `dist`. Pages resuelve rutas de React al servir `index.html` cuando la salida carece de un `404.html`. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Rutas de Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering)

Abrí la URL del deploy y `/admin` desde una ventana privada antes de compartir. Verificá los permisos de uso de las imágenes ilustrativas antes de compartir.

## Código y límites

- `src/commerce.ts` contiene stock, entrega, importes y evaluación del carrito.
- `src/repository.ts` concentra persistencia y validación local. `Store`, `Checkout` y `Admin` son las pantallas de React.
- Los productos, cantidades, precios, tarifas y resultados son de muestra. Los cambios del panel y el carrito viven en el navegador. El panel de demo está disponible a quien pueda abrir el sitio.
- Mercado Pago se simula. Transferencia muestra una vista previa de WhatsApp, un aviso sobre el comprobante y un estado pendiente. Efectivo aparece para retiro. El sitio no procesa pagos, no manda mensajes y no reserva inventario.

Antes de operar, definir una fuente de stock y precios, persistencia de pedidos, autorización del panel, validaciones de servidor y flujo de conciliación.

## Envío nacional de prueba

Desde el carrito, elegí **Envío nacional** y completá código postal, provincia o CABA y localidad antes de consultar el costo de ejemplo. El cálculo acepta cuatro dígitos o el formato de CPA. La demo no usa una base postal ni deduce direcciones del código. La tarifa depende de la provincia seleccionada y de la cantidad de unidades de ejemplo. Los grupos, importes, recargos por bulto y plazos ficticios están en `src/shipping.ts`. La simulación agrupa hasta seis unidades de catálogo por bulto. Eso sirve para mostrar el recálculo cuando cambia la cantidad.

En **Escenarios de cálculo de ejemplo** podés simular destino sin cotización o error. En esos estados el total queda pendiente y no se puede continuar. Volvé a consultar para probar el cálculo normal. En checkout, usá una calle, número y piso o departamento de fantasía. La vista previa de transferencia permanece en la página. La confirmación de prueba separa preparación, pago y entrega.

### Pendientes para producción

- Confirmar destinos habilitados y tarifas, recargos y plazos reales. Validar destino y cotización del lado servidor antes de aceptar el pedido.
- Definir embalaje para botellas, separadores, límites de peso y dimensiones, y validar las restricciones del servicio para vidrio y bebidas alcohólicas.
- Definir cobertura del seguro, exclusiones, documentación, responsables y plazos de reclamo.
- Incorporar seguimiento y registro de entrega. Separar las transiciones de preparación, pago, despacho y recepción.
- Definir quién gestiona roturas, entregas fallidas y devoluciones, y cómo se documentan, reponen o reintegran.
