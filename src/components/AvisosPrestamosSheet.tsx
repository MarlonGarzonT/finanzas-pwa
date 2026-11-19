import { BlockFooter, List, ListItem, Toggle } from 'konsta/react';
import type { EstadoPush } from '../data/notificacionesPush';
import type { NotificacionesPush } from '../data/useNotificacionesPush';
import { HojaInferior } from './HojaInferior';
import { IconoCampana } from './Iconos';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  push: NotificacionesPush;
}

// Qué se le dice a la persona en cada caso. Solo 'apagado', 'encendido' y
// 'sin-respuesta' dejan mover el interruptor; el resto explica qué hacer o
// por qué no se puede.
const TEXTO: Record<EstadoPush, string> = {
  cargando: 'Revisando si este teléfono puede recibir avisos…',
  encendido: 'Activados en este teléfono.',
  apagado: 'Apagados en este teléfono.',
  'sin-respuesta':
    'El navegador no mostró el permiso o lo cerraste. Busca el ícono de notificaciones (campana) en la barra de direcciones, elige Permitir y vuelve a encenderlo.',
  'requiere-instalar': 'En iPhone, primero agrega la app a tu pantalla de inicio: Compartir → Agregar a inicio. Ábrela desde ahí y vuelve aquí.',
  bloqueado: 'Las notificaciones de esta app están bloqueadas. Actívalas en los ajustes del teléfono o del navegador.',
  'no-soportado': 'Este navegador no permite notificaciones.',
  'sin-service-worker': 'Los avisos funcionan en la app publicada, no en esta versión de prueba.',
  'no-configurado': 'Los avisos todavía no están configurados en esta versión de la app.',
};

// Los avisos viven en una hoja que se abre desde la campana de la barra, no
// al final de la lista: con muchos préstamos la lista es larga y el ajuste
// quedaba enterrado debajo (y chocando con el botón flotante).
export function AvisosPrestamosSheet({ abierto, onCerrar, push }: Props) {
  const { estado, ocupado, error, alternar } = push;
  const controlable = estado === 'apagado' || estado === 'encendido' || estado === 'sin-respuesta';

  return (
    <HojaInferior abierto={abierto} titulo="Avisos de cobro" onCerrar={onCerrar} textoCerrar="Cerrar" cierreBloqueado={ocupado}>
      <div className="flex flex-col items-center gap-2 px-6 pt-2 pb-4 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary"
          aria-hidden="true"
        >
          <IconoCampana className="size-7" />
        </span>
        <h3 className="m-0 mt-1 text-[20px] leading-tight font-bold tracking-tight">Te avisamos si no te pagan</h3>
        <p className="m-0 text-[15px] leading-snug text-balance text-secundario">
          Llega un aviso a este teléfono el día después de la fecha acordada, y cada semana mientras la deuda siga sin pagar.
        </p>
      </div>

      <List strong inset className="mt-0 mb-2">
        <ListItem
          title="Avisarme si no me pagan"
          text={TEXTO[estado]}
          // Konsta corta el texto a 2 líneas; la instrucción de iPhone es más larga.
          contentClassName="[&_.line-clamp-2]:line-clamp-none"
          after={
            // Sin `label` en la fila: el Toggle de Konsta ya es un <label> y
            // anidarlos puede hacer que un toque cuente doble.
            <Toggle
              checked={estado === 'encendido'}
              onChange={alternar}
              disabled={!controlable || ocupado}
              aria-label="Avisarme si no me pagan"
            />
          }
        />
      </List>
      {error && (
        <BlockFooter className="text-alerta" role="alert">
          {error}
        </BlockFooter>
      )}
    </HojaInferior>
  );
}
