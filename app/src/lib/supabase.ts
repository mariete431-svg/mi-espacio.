import { createClient } from "@supabase/supabase-js";

// Base de datos de Mario. La clave "publishable" es pública a propósito:
// los datos están protegidos por las reglas (RLS) de la base de datos.
export const supabase = createClient(
  "https://uaojfcqpdngoqpjrmttx.supabase.co",
  "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q",
);

/**
 * Cliente "de visitante": nunca usa la sesión de administrador.
 * Los comentarios y las reservas solo están abiertos al público (rol anon) en la base de datos,
 * así que con la sesión de Mario abierta devolverían una lista vacía.
 */
export const publicClient = createClient(
  "https://uaojfcqpdngoqpjrmttx.supabase.co",
  "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q",
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sb-publico" } },
);

/** ¿La sesión abierta en este navegador es la de un administrador? */
export async function isAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const { data: ok, error } = await supabase.rpc("is_admin");
  return !error && ok === true;
}

/** Funciones públicas de reserva en la base de datos de Mario. */
export const bookingClient = publicClient;
