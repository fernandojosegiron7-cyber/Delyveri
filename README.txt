FG DELIVERY PWA — v1.2

QUÉ HACE
- Instalable como PWA desde el navegador.
- Inicia/detiene rastreo GPS.
- Envía ubicación al endpoint del plugin FG Menú Digital Premium v1.2.0.
- Usa el token privado del repartidor.
- Guarda configuración en el dispositivo.
- Usa Screen Wake Lock cuando el navegador lo permite.
- Funciona offline para cargar la interfaz; el envío GPS requiere internet.

INSTALACIÓN
1. Sube esta carpeta a tu hosting, por ejemplo:
   https://tudominio.com/delivery-pwa/

2. Debe funcionar con HTTPS.

3. Abre la PWA con:
   https://tudominio.com/delivery-pwa/?token=TOKEN_DEL_REPARTIDOR&ajax=https://tudominio.com/wp-admin/admin-ajax.php

4. En Android/Chrome:
   Menú del navegador > Instalar aplicación.

5. En iPhone/Safari:
   Compartir > Añadir a pantalla de inicio.

INTEGRACIÓN CON WORDPRESS
Necesita el plugin FG Menú Digital Premium v1.2.0 o superior, porque usa:
action=fg_update_driver_location

IMPORTANTE SOBRE GPS EN SEGUNDO PLANO
Una PWA depende de las reglas del navegador y del sistema operativo.
La ubicación puede pausarse si el teléfono bloquea la pantalla o suspende por completo la PWA.
Se usa Wake Lock cuando está disponible para ayudar a mantener la app activa con la pantalla encendida.
Para rastreo garantizado en segundo plano incluso con pantalla bloqueada, se requiere una app nativa Android/iOS.

FG Media Studios


VERCEL / CORS
1. Sube esta PWA a Vercel.
2. Copia tu dominio, por ejemplo:
   https://fg-delivery.vercel.app
3. En WordPress:
   FG Menú Digital > Configuración > Dominio permitido de la PWA
4. Pega exactamente:
   https://fg-delivery.vercel.app
5. Guarda cambios.

Enlace recomendado del repartidor:
https://fg-delivery.vercel.app/?token=TOKEN_PRIVADO&ajax=https://tusitio.com/wp-admin/admin-ajax.php

NOTA
- WordPress y la PWA deben usar HTTPS.
- El dominio permitido debe coincidir exactamente con el origen de Vercel.
- Si Vercel te asigna otro dominio, actualiza ese campo en WordPress.


VERSIÓN 1.2 — DESTINO DEL CLIENTE
- Consulta automáticamente el destino GPS del pedido.
- Muestra nombre y dirección del cliente.
- Botón "Abrir en Google Maps".
- Mapa con:
  - Ubicación del repartidor
  - Destino del cliente
  - Línea entre ambos
- Calcula distancia aproximada en km.
- Requiere plugin WordPress FG Menú Digital Premium v1.3.0 o superior.


VERSIÓN 1.3
- Consulta el pedido asignado al repartidor.
- Muestra estado actual.
- Permite marcar En camino y Entregado.
- Los cambios se guardan en WordPress.
- El botón Probar conexión ya NO modifica la ubicación del pedido.
- Refresca la información del pedido automáticamente.
