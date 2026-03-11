# Diseño: Formulario Seguro + Header Responsive

## Objetivo

Mejorar el proyecto existente sin rehacerlo desde cero, manteniendo el sitio estático actual y agregando solo la mínima capa server-side necesaria para que el formulario de contacto sea seguro, rate-limited y confiable. Supabase sigue siendo la fuente principal de almacenamiento y Resend reemplaza el envío de correo previo en cliente.

## Decisiones tomadas

- Runtime del backend: Supabase Edge Functions.
- Almacenamiento principal: tabla `contacto` en Supabase.
- Rate limiting: dentro de Supabase, sin servicios externos.
- Flujo final: validar, limitar, guardar en Supabase, enviar correo con Resend, responder al frontend.
- El frontend actual se conserva; se reemplaza solo la lógica insegura de contacto.

## Arquitectura

El formulario de [contacto.html](../contacto.html) envía un `POST` JSON a la Edge Function `contact`. Esa función valida el payload, chequea CORS, obtiene la IP real desde headers del runtime, hashea la IP, ejecuta un rate limit atómico vía RPC SQL, inserta la consulta en `contacto` y recién después notifica por correo usando la API HTTP oficial de Resend.

El frontend mantiene validación rápida para UX, pero el backend pasa a ser la fuente de verdad. El formulario incluye además un honeypot oculto para frenar bots básicos sin sumar CAPTCHA.

## Manejo de errores

- `400`: datos inválidos o JSON incorrecto.
- `403`: origen no permitido.
- `405`: método no permitido.
- `415`: content type inválido.
- `429`: más de 5 envíos por minuto desde la misma IP.
- `500`: error al validar rate limit o guardar en Supabase.
- `202`: la consulta quedó guardada, pero el correo no se envió o Resend no está configurado.
- `200`: guardado exitoso y correo enviado.

## Responsive del blog

El problema del header en posts venía de overrides locales que redefinían `.contenedor` a `800px`, afectando también el header global. La solución es scopear esos estilos al bloque del artículo (`.seccion-noticia .contenedor`) y reforzar el CTA del menú para que no haga wrap en desktop/tablet chico.

## Verificación prevista

- Guardado de consultas en Supabase.
- Envío de correo con Resend desde `cde.com.ar`.
- Sexto envío en un minuto por IP responde `429`.
- Fallo de correo no provoca pérdida de datos ni reenvíos manuales innecesarios.
- Header consistente en home, listado de noticias y posts individuales en desktop, tablet y mobile.