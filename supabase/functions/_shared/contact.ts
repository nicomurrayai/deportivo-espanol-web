export interface ContactPayload {
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  company: string;
}

export interface ContactValidationResult {
  value: ContactPayload | null;
  errorMessage: string | null;
  honeypotTriggered: boolean;
}

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,120}$/;
const PHONE_REGEX = /^[0-9+\s()-]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;

function getStringField(
  payload: Record<string, unknown>,
  key: string,
): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function normalizeSingleLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeMessage(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

export function validateContactPayload(
  payload: unknown,
): ContactValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      value: null,
      errorMessage: "Los datos enviados no son válidos.",
      honeypotTriggered: false,
    };
  }

  const source = payload as Record<string, unknown>;
  const nombre = normalizeSingleLine(getStringField(source, "nombre"));
  const telefono = normalizeSingleLine(getStringField(source, "telefono"));
  const email = normalizeSingleLine(getStringField(source, "email")).toLowerCase();
  const mensaje = normalizeMessage(getStringField(source, "mensaje"));
  const company = normalizeSingleLine(getStringField(source, "company"));

  if (company.length > 0) {
    return {
      value: null,
      errorMessage: null,
      honeypotTriggered: true,
    };
  }

  if (!NAME_REGEX.test(nombre)) {
    return {
      value: null,
      errorMessage:
        "Ingresá un nombre válido, usando solo letras y al menos 3 caracteres.",
      honeypotTriggered: false,
    };
  }

  if (!PHONE_REGEX.test(telefono)) {
    return {
      value: null,
      errorMessage:
        "Ingresá un teléfono válido, con entre 7 y 20 caracteres.",
      honeypotTriggered: false,
    };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    return {
      value: null,
      errorMessage: "Ingresá un correo electrónico válido.",
      honeypotTriggered: false,
    };
  }

  if (mensaje.length < 10 || mensaje.length > MAX_MESSAGE_LENGTH) {
    return {
      value: null,
      errorMessage:
        `El mensaje debe tener entre 10 y ${MAX_MESSAGE_LENGTH} caracteres.`,
      honeypotTriggered: false,
    };
  }

  return {
    value: {
      nombre,
      telefono,
      email,
      mensaje,
      company,
    },
    errorMessage: null,
    honeypotTriggered: false,
  };
}

export function isJsonContentType(contentType: string | null): boolean {
  return Boolean(contentType && contentType.includes("application/json"));
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const headerCandidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
  ];

  for (const value of headerCandidates) {
    if (value) {
      return value.trim();
    }
  }

  return "unknown";
}

export async function hashValue(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildNotificationText(payload: ContactPayload): string {
  return [
    "Nueva consulta enviada desde el sitio web.",
    "",
    `Nombre: ${payload.nombre}`,
    `Email: ${payload.email}`,
    `Telefono: ${payload.telefono}`,
    "",
    "Mensaje:",
    payload.mensaje,
  ].join("\n");
}

export function parseRecipients(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}