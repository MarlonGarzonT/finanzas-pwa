import { BlockFooter, List, ListItem, Toggle } from 'konsta/react';
import type { EstadoPush } from '../data/notificacionesPush';
import { useNotificacionesPush } from '../data/useNotificacionesPush';

// Qué se le explica a la persona en cada caso. Solo 'apagado' y 'encendido'
// dejan mover el interruptor; el resto dice qué hacer o por qué no se puede.
const TEXTO: Record<EstadoPush, string> = {
  cargando: 'Revisando si este teléfono puede recibir avisos…',
  encendido: 'Te llega un aviso en este teléfono el día después de la fecha acordada, y cada semana mientras no te paguen.',
  apagado: 'Recibe un aviso en este teléfono cuando alguien no te pague a tiempo.',
  'sin-respuesta':
    'El navegador no mostró el permiso o lo cerraste. Busca el ícono de notificaciones (campana) en la barra de direcciones, elige Permitir y vuelve a encenderlo.',
  'requiere-instalar': 'En iPhone, primero agrega la app a tu pantalla de inicio: Compartir → Agregar a inicio. Ábrela desde ahí y vuelve aquí.',
  bloqueado: 'Las notificaciones de esta app están bloqueadas. Actívalas en los ajustes del teléfono o del navegador.',
  'no-soportado': 'Este navegador no permite notificaciones.',
  'sin-service-worker': 'Los avisos funcionan en la app publicada, no en esta versión de prueba.',
  'no-configurado': 'Los avisos todavía no están configurados en esta versión de la app.',
};

export function AvisosPrestamos() {
  const { estado, ocupado, error, alternar } = useNotificacionesPush();
  const controlable = estado === 'apagado' || estado === 'encendido' || estado === 'sin-respuesta';

  return (
    <>
      <List strong inset className="mb-2">
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
    </>
  );
}
