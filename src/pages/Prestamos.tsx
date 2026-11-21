import { Link, Navbar, Page } from 'konsta/react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AvisosPrestamosSheet } from '../components/AvisosPrestamosSheet';
import { EncabezadoWeb } from '../components/EncabezadoWeb';
import { IconoCampana } from '../components/Iconos';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import type { EstadoNavegacionPrestamos } from '../components/useAbrirMovimiento';
import { VistaCreditos } from '../components/VistaCreditos';
import { VistaPrestamos } from '../components/VistaPrestamos';
import { useNotificacionesPush, type NotificacionesPush } from '../data/useNotificacionesPush';

type Vista = 'te-deben' | 'debes';

const CLAVE_VISTA = 'mi-cuadre:vista-prestamos';
const UMBRAL_BOTON_COMPACTO_PX = 48;

// La última vista que se usó: quien paga un crédito abre directo "Debes".
function vistaGuardada(): Vista {
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'debes' ? 'debes' : 'te-deben';
  } catch {
    return 'te-deben';
  }
}

interface PropsAvisos {
  push: NotificacionesPush;
  onAbrir: () => void;
}

// La campana de los avisos de cobro, en la barra del celular y en el
// encabezado de escritorio. Punto verde si están encendidos.
function BotonAvisos({ push, onAbrir }: PropsAvisos) {
  return (
    <Link
      iconOnly
      onClick={onAbrir}
      aria-label={`Avisos de cobro, ${push.estado === 'encendido' ? 'activados' : 'apagados'}`}
      className="relative"
    >
      <IconoCampana className="size-7" />
      {/* Punto verde: los avisos están encendidos (el estado también se lee en la hoja). */}
      {push.estado === 'encendido' && (
        <span className="absolute top-2 right-2 size-2.5 rounded-full bg-ingreso-relleno ring-2 ring-ios-light-surface dark:ring-black" aria-hidden="true" />
      )}
    </Link>
  );
}

// Una sola pestaña para toda la plata prestada, en las dos direcciones: lo que
// te deben a ti (préstamos) y lo que debes tú (créditos). Cada una tiene su
// propia lista, su botón y sus hojas.
export function Prestamos() {
  const estadoNavegacion = useLocation().state as EstadoNavegacionPrestamos | null;
  const [vista, setVista] = useState<Vista>(() => (estadoNavegacion?.creditoId ? 'debes' : estadoNavegacion?.prestamoId ? 'te-deben' : vistaGuardada()));
  const [avisosAbierto, setAvisosAbierto] = useState(false);
  // Al bajar por una lista larga el botón flotante se queda solo con el "+":
  // con el texto tapaba el monto y el estado de las tarjetas que pasan por debajo.
  const [botonCompacto, setBotonCompacto] = useState(false);
  const push = useNotificacionesPush();

  function elegirVista(nueva: Vista) {
    setVista(nueva);
    try {
      localStorage.setItem(CLAVE_VISTA, nueva);
    } catch {
      // Sin almacenamiento: la próxima vez se abre en "Te deben".
    }
  }

  const selector = (
    <SelectorVidrio>
      <OpcionSelector active={vista === 'te-deben'} onClick={() => elegirVista('te-deben')}>
        Te deben
      </OpcionSelector>
      <OpcionSelector active={vista === 'debes'} onClick={() => elegirVista('debes')}>
        Debes
      </OpcionSelector>
    </SelectorVidrio>
  );

  return (
    <Page
      className="pagina-con-fab"
      onScroll={(e: React.UIEvent<HTMLElement>) => setBotonCompacto(e.currentTarget.scrollTop > UMBRAL_BOTON_COMPACTO_PX)}
    >
      <Navbar
        className="lg:hidden"
        centerTitle
        title="Préstamos"
        right={<BotonAvisos push={push} onAbrir={() => setAvisosAbierto(true)} />}
      />
      <EncabezadoWeb
        titulo="Préstamos"
        acciones={
          <>
            <div className="w-[260px]">{selector}</div>
            <BotonAvisos push={push} onAbrir={() => setAvisosAbierto(true)} />
          </>
        }
      />

      <div className="px-4 pb-4 lg:hidden">{selector}</div>

      {vista === 'te-deben' ? (
        <VistaPrestamos botonCompacto={botonCompacto} idInicial={estadoNavegacion?.prestamoId ?? null} />
      ) : (
        <VistaCreditos botonCompacto={botonCompacto} idInicial={estadoNavegacion?.creditoId ?? null} />
      )}

      <AvisosPrestamosSheet abierto={avisosAbierto} onCerrar={() => setAvisosAbierto(false)} push={push} />
    </Page>
  );
}
