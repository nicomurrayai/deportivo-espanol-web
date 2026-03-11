# Setup de Contacto Seguro

## Qué se agregó

- Edge Function en `supabase/functions/contact`.
- Migración para la tabla `contacto`.
- Migración para rate limiting por IP hasheada.
- Script frontend en `js/contact-form.js`.
- Correcciones responsive del header en posts.

## Requisitos

1. Supabase CLI instalado y autenticado.
2. Proyecto Supabase vinculado al proyecto `dguqkvbwbzqbicyeltjo`.
3. Dominio `cde.com.ar` verificado en Resend.
4. Una casilla emisora válida, por ejemplo `contacto@cde.com.ar`.

## Variables secretas de la función

Definir en Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_NOTIFICATION_TO`
- `CONTACT_ALLOWED_ORIGINS`
- `CONTACT_EMAIL_SUBJECT_PREFIX`

Valores sugeridos:

- `RESEND_FROM_EMAIL=Contacto CDE <contacto@cde.com.ar>`
- `CONTACT_NOTIFICATION_TO=info@cde.com.ar`
- `CONTACT_ALLOWED_ORIGINS=https://cde.com.ar,https://www.cde.com.ar,http://localhost:5500,http://127.0.0.1:5500`
- `CONTACT_EMAIL_SUBJECT_PREFIX=[Consulta Web CDE]`

## Despliegue

Aplicar migraciones:

```bash
supabase db push
```

Definir secrets:

```bash
supabase secrets set \
  SUPABASE_URL="https://dguqkvbwbzqbicyeltjo.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  RESEND_API_KEY="<resend-api-key>" \
  RESEND_FROM_EMAIL="Contacto CDE <contacto@cde.com.ar>" \
  CONTACT_NOTIFICATION_TO="info@cde.com.ar" \
  CONTACT_ALLOWED_ORIGINS="https://cde.com.ar,https://www.cde.com.ar,http://localhost:5500,http://127.0.0.1:5500" \
  CONTACT_EMAIL_SUBJECT_PREFIX="[Consulta Web CDE]"
```

Deploy de la función:

```bash
supabase functions deploy contact --no-verify-jwt
```

## Endpoint esperado

El frontend quedó apuntado a:

`https://dguqkvbwbzqbicyeltjo.functions.supabase.co/contact`

Si cambia el proyecto de Supabase o se usa otro entorno, actualizar `data-contact-endpoint` en `contacto.html`.

## Flujo implementado

1. El usuario envía el formulario.
2. El frontend valida formato básico y envía JSON al backend.
3. La Edge Function valida nuevamente.
4. Se aplica rate limiting de 5 envíos por minuto por IP.
5. Se guarda la consulta en Supabase.
6. Se envía la notificación por Resend.
7. El frontend muestra estado visual claro según el resultado.

## Casos de respuesta

- `200`: consulta guardada y correo enviado.
- `202`: consulta guardada, pero el correo no se envió.
- `400`: datos inválidos.
- `429`: rate limit excedido.
- `500`: error interno al guardar o validar.

## Validación manual recomendada

1. Enviar un formulario válido y confirmar fila creada en `contacto`.
2. Verificar recepción del correo en el destino configurado.
3. Ejecutar 6 envíos seguidos desde la misma IP y confirmar `429` en el sexto.
4. Revisar el header de los posts en mobile y tablet.

## Notas

- El honeypot descarta bots básicos sin mostrar error.
- Si Resend falla, el usuario no debería reenviar manualmente porque la consulta ya queda persistida.
- Para pruebas locales, servir el sitio desde `localhost` o `127.0.0.1`; abrir el HTML con `file://` no está contemplado por CORS.
