# Setup de Contacto Seguro

## Qué se agregó

- Edge Function en `supabase/functions/contact`.
- Migración para la tabla `contacto`.
- Control diario en frontend vía `localStorage`.
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
- `CONTACT_EMAIL_SUBJECT_PREFIX`

Valores sugeridos:

- `RESEND_FROM_EMAIL=Contacto CDE <contacto@cde.com.ar>`
- `CONTACT_NOTIFICATION_TO=info@cde.com.ar`
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
2. El frontend valida formato básico y verifica en `localStorage` si ese navegador ya envió una consulta hoy.
3. Si no hubo envío en el día, envía JSON al backend.
4. La Edge Function valida nuevamente y guarda la consulta en Supabase.
5. Se envía la notificación por Resend.
6. Si la respuesta fue exitosa, el frontend guarda la fecha del envío en `localStorage`.
7. El frontend muestra estado visual claro según el resultado.

## Casos de respuesta

- `200`: consulta guardada y correo enviado.
- `202`: consulta guardada, pero el correo no se envió.
- `400`: datos inválidos.
- `500`: error interno al guardar o procesar.

## Validación manual recomendada

1. Enviar un formulario válido y confirmar fila creada en `contacto`.
2. Verificar recepción del correo en el destino configurado.
3. Intentar un segundo envío el mismo día desde el mismo navegador y confirmar que el frontend lo bloquea.
4. Revisar el header de los posts en mobile y tablet.

## Notas

- El honeypot descarta bots básicos sin mostrar error.
- Si Resend falla, el usuario no debería reenviar manualmente porque la consulta ya queda persistida.
- La función quedó abierta a cualquier origen, incluyendo `localhost`, otros dominios y navegadores que envíen `Origin: null`.
- El límite diario en `localStorage` no es una medida de seguridad fuerte: se puede saltear borrando almacenamiento local, usando otro navegador o llamando directo al endpoint.
