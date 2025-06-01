// src/lib/api.ts

/**
 * URL base de tu backend AURA.
 * Si luego lo subes a un dominio o usas Traefik/Cloudflare Tunnel, modifica esta constante.
 */
export const BASE_URL = "http://localhost:4000";

/**
 * handleResponse: lee la respuesta de fetch(), convierte a JSON si es posible
 * y lanza Error(data.message) en caso de status != 2xx. Si no hay
 * data.message, lanza Error(response.statusText).
 */
export async function handleResponse(response: Response) {
  // Intentamos leer el texto. Si no es JSON válido, data será simplemente texto puro.
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    // Si el backend devolvió un JSON con { message: "algo" }, usamos ese mensaje.
    if (data && typeof data === "object" && data.message) {
      throw new Error(data.message);
    }
    // En otro caso (p. ej. cuerpo vacío), usamos statusText ("Bad Request", etc.).
    throw new Error(response.statusText);
  }

  // Si está todo OK, devolvemos data (puede ser objeto o arreglo).
  return data;
}

/**
 * request: función genérica para hacer fetch a tu API.
 * - endpoint: cadena con la ruta (ej. "/auth/login", "/devices").
 * - options: headers, body, method, etc.
 */
export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Preparamos headers; si el body es un objeto JS, asumimos JSON:
  const headers: HeadersInit = options.headers
    ? (options.headers as HeadersInit)
    : {};

  if (options.body && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    headers,
  });

  return handleResponse(response);
}

