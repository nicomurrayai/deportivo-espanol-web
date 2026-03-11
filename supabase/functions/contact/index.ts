import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, getAllowedOrigins, resolveAllowedOrigin } from "../_shared/cors.ts";
import {
  buildConfirmationHtml,
  buildConfirmationText,
  buildNotificationText,
  isJsonContentType,
  parseRecipients,
  validateContactPayload,
} from "../_shared/contact.ts";

interface EmailAttachment {
  content: string;
  filename: string;
  content_id?: string;
}

interface SendEmailArgs {
  apiKey: string;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
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
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      subject: args.subject,
      text: args.text,
      ...(args.html ? { html: args.html } : {}),
      ...(args.attachments && args.attachments.length > 0
        ? { attachments: args.attachments }
        : {}),
    }),
  });

  if (!response.ok) {
    console.error("Resend email failed", response.status, await response.text());
  }

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
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "contacto@entrevistate.com";
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const insertResult = await supabase
    .from("contacto")
    .insert([
      {
        nombrecompleto: contact.nombre,
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

  if (!resendApiKey) {
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

  const [notificationSent, confirmationSent] = await Promise.all([
    notificationRecipients.length > 0
      ? sendResendEmail({
        apiKey: resendApiKey,
        from: resendFromEmail,
        to: notificationRecipients,
        replyTo: contact.email,
        subject: `${emailSubjectPrefix} ${contact.nombre}`,
        text: buildNotificationText(contact),
      })
      : Promise.resolve(false),
    sendResendEmail({
      apiKey: resendApiKey,
      from: resendFromEmail,
      to: [contact.email],
      replyTo: notificationRecipients[0],
      subject: "CONSULTA RECIBIDA",
      text: buildConfirmationText(contact),
      html: buildConfirmationHtml(contact),
      attachments: [
        {
          content: CLUB_LOGO_BASE64,
          filename: "escudo.png",
          content_id: "club-logo",
        },
      ],
    }),
  ]);

  if (!notificationSent || !confirmationSent) {
    return jsonResponse(
      {
        ok: true,
        status: "stored_with_partial_email",
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