import * as db from '../db';

// Clave pública VAPID. Es pública por diseño (cada navegador la recibe al
// suscribirse), así que va en el código y no en un secret. Su pareja privada
// vive solo en los secrets de la Edge Function avisar-prestamos-vencidos: si
// se cambia una, hay que cambiar la otra.
const CLAVE_PUBLICA_VAPID: string | undefined =
  'BN6gLX5cpn8uozfEuKkMqfOUmvB51GIY8ZsGHMKb33eeO-AVCbQsBZpBvyl9u2bT5NcB7TiN89jO-Rdy2Uy84rM';

export type EstadoPush =
  | 'cargando'
  // Se pidió el permiso pero el navegador no lo concedió ni lo bloqueó: cerró
  // la ventana o (Edge, Chrome) la mostró en silencio en la barra de direcciones.
  | 'sin-respuesta'
  | 'no-configurado'
  | 'no-soportado'
  | 'requiere-instalar'
  | 'sin-service-worker'
  | 'bloqueado'
  | 'apagado'
  | 'encendido';

// Sin service worker activo (modo desarrollo) `ready` nunca resuelve.
const ESPERA_SERVICE_WORKER_MS = 4000;

function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function estaInstalada(): boolean {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || standalone === true;
}

function base64UrlABytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const binario = atob((base64Url + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function registroListo(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<undefined>((resolver) => window.setTimeout(() => resolver(undefined), ESPERA_SERVICE_WORKER_MS)),
  ]);
}

// Una suscripción creada con otra clave pública (se cambió el par VAPID) ya no
// sirve: el servidor no puede enviarle nada y el navegador no deja crear otra
// encima sin borrarla antes.
function esDeEstaClave(suscripcion: PushSubscription): boolean {
  const clave = suscripcion.options.applicationServerKey;
  if (!clave || !CLAVE_PUBLICA_VAPID) return false;
  const actual = base64UrlABytes(CLAVE_PUBLICA_VAPID);
  const guardada = new Uint8Array(clave);
  return guardada.length === actual.length && guardada.every((byte, i) => byte === actual[i]);
}

export interface ConsultaPush {
  estado: EstadoPush;
  registro?: ServiceWorkerRegistration;
}

export async function consultarPush(): Promise<ConsultaPush> {
  if (!CLAVE_PUBLICA_VAPID) return { estado: 'no-configurado' };
  // En iPhone el push solo existe con la app agregada a la pantalla de inicio.
  if (esIOS() && !estaInstalada()) return { estado: 'requiere-instalar' };
  if (!('PushManager' in window) || !('Notification' in window)) return { estado: 'no-soportado' };
  const registro = await registroListo();
  if (!registro) return { estado: 'sin-service-worker' };
  if (Notification.permission === 'denied') return { estado: 'bloqueado', registro };
  const suscripcion = await registro.pushManager.getSubscription();
  // Una suscripción de otra clave cuenta como apagada: así la persona la
  // vuelve a encender y queda una nueva que sí recibe los avisos.
  const encendido = suscripcion !== null && esDeEstaClave(suscripcion) && Notification.permission === 'granted';
  return { estado: encendido ? 'encendido' : 'apagado', registro };
}

// Debe llamarse directo desde el toque de la persona: Safari solo muestra el
// permiso si `subscribe` corre dentro del gesto, sin esperas antes.
export async function activarPush(registro: ServiceWorkerRegistration): Promise<EstadoPush> {
  if (!CLAVE_PUBLICA_VAPID) return 'no-configurado';
  let suscripcion: PushSubscription;
  try {
    // Con el permiso ya concedido no hay ventana que pedir, así que esperar
    // aquí no rompe la regla del gesto de Safari.
    if (Notification.permission === 'granted') {
      const previa = await registro.pushManager.getSubscription();
      if (previa && !esDeEstaClave(previa)) await previa.unsubscribe();
    }
    // Si ya hay una suscripción con esta clave, subscribe la devuelve tal cual.
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlABytes(CLAVE_PUBLICA_VAPID),
    });
  } catch (error) {
    // Rechazó el permiso (o lo tiene bloqueado): no es una falla de la app.
    if (Notification.permission !== 'granted') return Notification.permission === 'denied' ? 'bloqueado' : 'sin-respuesta';
    throw error;
  }
  const { endpoint, keys } = suscripcion.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('Suscripción incompleta');
  await db.guardarSuscripcionPush(endpoint, keys.p256dh, keys.auth);
  return 'encendido';
}

export async function desactivarPush(registro: ServiceWorkerRegistration): Promise<void> {
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return;
  // Primero en la base: si falla (sin señal), el aviso sigue encendido y se
  // le dice a la persona, en vez de quedar a medias.
  await db.eliminarSuscripcionPush(suscripcion.endpoint);
  await suscripcion.unsubscribe();
}

const ESPERA_AL_SALIR_MS = 3000;

// Al cerrar sesión el dispositivo deja de recibir los avisos de esa cuenta
// (importa en un teléfono compartido). Nunca bloquea la salida: sin señal o
// sin service worker, sigue de largo.
export async function quitarPushDeEsteDispositivo(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const registro = await navigator.serviceWorker.getRegistration();
    const suscripcion = await registro?.pushManager?.getSubscription();
    if (!suscripcion) return;
    await Promise.race([
      db.eliminarSuscripcionPush(suscripcion.endpoint),
      new Promise((resolver) => window.setTimeout(resolver, ESPERA_AL_SALIR_MS)),
    ]);
    await suscripcion.unsubscribe();
  } catch {
    // Si no se pudo borrar, la Edge Function la limpia cuando el envío falle.
  }
}
