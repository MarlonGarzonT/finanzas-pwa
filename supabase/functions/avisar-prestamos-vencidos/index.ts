// Edge Function: avisa por push a quien tenga préstamos vencidos sin pagar.
//
// La invoca una vez al día pg_cron (ver docs/avisos-prestamos.md). Se despliega
// sin verificación de JWT (--no-verify-jwt) y en su lugar exige el encabezado
// x-cron-secret: así nadie más puede dispararla.
//
// Secrets: CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (mailto:tu-correo). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta
// Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface PrestamoPorAvisar {
  prestamo_id: string;
  user_id: string;
  persona: string;
  saldo: number;
  fecha_devolucion: string;
}

interface Suscripcion {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const json = (datos: unknown, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } });

const pesos = (monto: number) =>
  `$${Math.round(Number(monto)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;

// '2026-11-05' → '5 nov'. Se arma a mano (sin new Date) para que la zona
// horaria del servidor no lo corra un día.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaCorta = (iso: string) => {
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia} ${MESES[mes - 1]}`;
};

function nombres(lista: string[]): string {
  if (lista.length <= 1) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

function mensaje(prestamos: PrestamoPorAvisar[]) {
  if (prestamos.length === 1) {
    const [p] = prestamos;
    return {
      titulo: `${p.persona} no te ha pagado`,
      cuerpo: `Te debe ${pesos(p.saldo)}. Quedó de pagarte el ${fechaCorta(p.fecha_devolucion)}.`,
    };
  }
  const total = prestamos.reduce((acc, p) => acc + Number(p.saldo), 0);
  const personas = [...new Set(prestamos.map((p) => p.persona))];
  return {
    titulo: `${prestamos.length} préstamos sin pagar`,
    cuerpo: `${nombres(personas)} te deben ${pesos(total)} entre todos.`,
  };
}

Deno.serve(async (req: Request) => {
  const secreto = Deno.env.get('CRON_SECRET');
  if (!secreto) return json({ error: 'Falta el secret CRON_SECRET' }, 500);
  if (req.headers.get('x-cron-secret') !== secreto) return json({ error: 'No autorizado' }, 401);

  try {
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );

    // Service role: lee los préstamos y suscripciones de todas las cuentas.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    const { data: vencidos, error } = await supabase.rpc('prestamos_por_avisar');
    if (error) throw error;

    const porUsuario = new Map<string, PrestamoPorAvisar[]>();
    for (const p of (vencidos ?? []) as PrestamoPorAvisar[]) {
      porUsuario.set(p.user_id, [...(porUsuario.get(p.user_id) ?? []), p]);
    }

    const resultado = { usuarios: porUsuario.size, enviados: 0, fallidos: 0, limpiadas: 0 };
    const avisados: string[] = [];
    const caducadas: string[] = [];

    for (const [userId, prestamos] of porUsuario) {
      const { data: suscripciones, error: errorSuscripciones } = await supabase
        .from('suscripciones_push')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', userId);
      if (errorSuscripciones) throw errorSuscripciones;
      // Sin dispositivos suscritos no se marca como avisado: si activa los
      // avisos mañana, le llega el primero.
      if (!suscripciones?.length) continue;

      const carga = JSON.stringify({ ...mensaje(prestamos), ruta: '/prestamos', etiqueta: 'prestamos-vencidos' });
      let algunoLlego = false;
      await Promise.all(
        (suscripciones as Suscripcion[]).map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, {
              TTL: 60 * 60 * 24,
              urgency: 'normal',
            });
            algunoLlego = true;
            resultado.enviados += 1;
          } catch (errorEnvio) {
            resultado.fallidos += 1;
            const status = (errorEnvio as { statusCode?: number }).statusCode;
            // 404/410: el navegador anuló la suscripción (desinstaló la app,
            // quitó el permiso). Se borra para no reintentar.
            if (status === 404 || status === 410) caducadas.push(s.id);
            else console.warn('[push] Error enviando', status, errorEnvio);
          }
        })
      );
      if (algunoLlego) avisados.push(...prestamos.map((p) => p.prestamo_id));
    }

    if (avisados.length) {
      const { error: errorMarca } = await supabase
        .from('prestamos')
        .update({ ultimo_aviso: new Date().toISOString() })
        .in('id', avisados);
      if (errorMarca) console.error('[push] No se pudo marcar ultimo_aviso', errorMarca);
    }
    if (caducadas.length) {
      await supabase.from('suscripciones_push').delete().in('id', caducadas);
      resultado.limpiadas = caducadas.length;
    }

    return json(resultado);
  } catch (err) {
    console.error('[avisar-prestamos-vencidos]', err);
    return json({ error: (err as Error).message }, 500);
  }
});
