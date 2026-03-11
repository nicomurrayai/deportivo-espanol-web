import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, getAllowedOrigins, resolveAllowedOrigin } from "../_shared/cors.ts";
import {
  buildNotificationText,
  getClientIp,
  hashValue,
  isJsonContentType,
  parseRecipients,
  validateContactPayload,
} from "../_shared/contact.ts";

interface RateLimitRow {
  allowed: boolean;
  request_count: number;
  retry_after_seconds: number;
}

interface SendEmailArgs {
  apiKey: string;
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

async function sendResendEmail(args: SendEmailArgs): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      reply_to: [args.replyTo],
      subject: args.subject,
      text: args.text,
    }),
  });

  return response.ok;
}

Deno.serve(async (request) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");
  const resolvedOrigin = resolveAllowedOrigin(origin, allowedOrigins);
  const corsHeaders = buildCorsHeaders(origin, allowedOrigins);

  if (request.method === "OPTIONS") {
    if (origin && !resolvedOrigin && !allowedOrigins.includes("*")) {
      return jsonResponse(
        {
          ok: false,
          status: "origin_not_allowed",
          message: "Origen no permitido.",
        },
        403,
        corsHeaders,
      );
    }

    return new Response("ok", { headers: corsHeaders });
  }

  if (origin && !resolvedOrigin && !allowedOrigins.includes("*")) {
    return jsonResponse(
      {
        ok: false,
        status: "origin_not_allowed",
        message: "Origen no permitido.",
      },
      403,
      corsHeaders,
    );
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        status: "method_not_allowed",
        message: "Método no permitido.",
      },
      405,
      corsHeaders,
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return jsonResponse(
      {
        ok: false,
        status: "invalid_content_type",
        message: "El endpoint solo acepta JSON.",
      },
      415,
      corsHeaders,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "contacto@cde.com.ar";
  const notificationRecipients = parseRecipients(
    Deno.env.get("CONTACT_NOTIFICATION_TO"),
  );
  const emailSubjectPrefix = Deno.env.get("CONTACT_EMAIL_SUBJECT_PREFIX") ??
    "[Consulta Web CDE]";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        ok: false,
        status: "server_misconfigured",
        message: "El servicio de contacto no está configurado correctamente.",
      },
      500,
      corsHeaders,
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        status: "invalid_json",
        message: "No pudimos leer los datos enviados.",
      },
      400,
      corsHeaders,
    );
  }

  const validation = validateContactPayload(requestBody);

  if (validation.honeypotTriggered) {
    return jsonResponse(
      {
        ok: true,
        status: "accepted",
        message: "Tu consulta fue recibida.",
      },
      202,
      corsHeaders,
    );
  }

  if (!validation.value || validation.errorMessage) {
    return jsonResponse(
      {
        ok: false,
        status: "invalid_data",
        message: validation.errorMessage ?? "Los datos enviados no son válidos.",
      },
      400,
      corsHeaders,
    );
  }

  const contact = validation.value;
  const clientIp = getClientIp(request.headers);
  const ipHash = await hashValue(clientIp);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rateLimitResult = await supabase.rpc("enforce_contact_rate_limit", {
    ip_hash_input: ipHash,
    request_time: new Date().toISOString(),
  });

  if (rateLimitResult.error) {
    return jsonResponse(
      {
        ok: false,
        status: "rate_limit_check_failed",
        message: "No pudimos validar el límite de envíos. Intentá nuevamente.",
      },
      500,
      corsHeaders,
    );
  }

  const rateLimitRow = Array.isArray(rateLimitResult.data)
    ? rateLimitResult.data[0] as RateLimitRow | undefined
    : undefined;

  if (!rateLimitRow?.allowed) {
    const retryAfter = rateLimitRow?.retry_after_seconds ?? 60;

    return jsonResponse(
      {
        ok: false,
        status: "rate_limit_exceeded",
        message:
          "Demasiados envíos desde esta IP. Esperá un minuto antes de intentar nuevamente.",
        retryAfterSeconds: retryAfter,
      },
      429,
      {
        ...corsHeaders,
        "Retry-After": String(retryAfter),
      },
    );
  }

  const insertResult = await supabase
    .from("contacto")
    .insert([
      {
        nombreCompleto: contact.nombre,
        email: contact.email,
        telefono: contact.telefono,
        mensaje: contact.mensaje,
      },
    ]);

  if (insertResult.error) {
    return jsonResponse(
      {
        ok: false,
        status: "supabase_error",
        message: "No pudimos guardar tu consulta. Intentá nuevamente.",
      },
      500,
      corsHeaders,
    );
  }

  if (!resendApiKey || notificationRecipients.length === 0) {
    return jsonResponse(
      {
        ok: true,
        status: "stored_without_email",
        message:
          "Tu consulta fue registrada. No hace falta reenviarla aunque el correo todavía no esté configurado.",
      },
      202,
      corsHeaders,
    );
  }

  const emailSent = await sendResendEmail({
    apiKey: resendApiKey,
    from: resendFromEmail,
    to: notificationRecipients,
    replyTo: contact.email,
    subject: `${emailSubjectPrefix} ${contact.nombre}`,
    text: buildNotificationText(contact),
  });

  if (!emailSent) {
    return jsonResponse(
      {
        ok: true,
        status: "stored_without_email",
        message:
          "Tu consulta fue registrada correctamente. No hace falta reenviarla.",
      },
      202,
      corsHeaders,
    );
  }

  return jsonResponse(
    {
      ok: true,
      status: "success",
      message: "Tu consulta fue enviada correctamente. Te responderemos pronto.",
    },
    200,
    corsHeaders,
  );
});