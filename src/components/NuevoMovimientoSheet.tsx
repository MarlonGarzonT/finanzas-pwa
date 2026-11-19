import { BlockTitle, Button, List } from 'konsta/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Categoria, Tipo, Transaccion } from '../types';
import { fechaLocalISO, formatearMonto } from '../utils/fechas';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { NuevaCategoriaSheet } from './NuevaCategoriaSheet';
import { PasosDeslizantes, ProgresoPasos } from './PasosDeslizantes';
import { ResumenMovimiento } from './ResumenMovimiento';
import { SelectorCategoria } from './SelectorCategoria';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import { PASOS_MOVIMIENTO, useFormularioMovimiento, type DatosMovimiento } from './useFormularioMovimiento';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  // Mes en el que arranca la fecha de un movimiento nuevo (el que la persona
  // tiene elegido en la pantalla desde la que abrió la hoja).
  mesSeleccionado: Date;
  onCerrar: () => void;
  // `dia`: 'AAAA-MM-DD' elegido en el formulario; la hora la pone quien guarda.
  onGuardar: (datos: DatosMovimiento) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCrearCategoria: (nombre: string, tipo: Tipo) => Promise<Categoria>;
}

function Encabezado({ children, derecha }: { children: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pb-3">
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight">{children}</h3>
      {derecha}
    </div>
  );
}

// Un movimiento nuevo se registra en tres pasos (monto → categoría → detalle)
// que se deslizan como en iOS; editar uno existente muestra todo a la vez,
// porque ahí se cambia un solo dato y los pasos estorbarían.
export function NuevoMovimientoSheet({
  abierto,
  categorias,
  transaccion,
  mesSeleccionado,
  onCerrar,
  onGuardar,
  onEliminar,
  onCrearCategoria,
}: Props) {
  const f = useFormularioMovimiento({ abierto, categorias, transaccion, mesSeleccionado, onGuardar });
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  // El modo se recuerda mientras la hoja se anima al cerrar: el padre limpia
  // `transaccion` al cerrar y el título no debe cambiar a mitad de la salida.
  const [editando, setEditando] = useState(Boolean(transaccion));
  if (abierto && editando !== Boolean(transaccion)) setEditando(Boolean(transaccion));
  // Cerrar la hoja cierra también la de "Nueva categoría".
  if (!abierto && creandoCategoria) setCreandoCategoria(false);
  const ultimoPaso = f.paso === PASOS_MOVIMIENTO.length - 1;

  // Al llegar al último paso el cursor ya está en la descripción. Se hace al
  // montar el paso (no con autoFocus) porque los pasos están montados desde el
  // inicio y el primer campo en enfocarse debe ser el monto.
  useEffect(() => {
    if (!abierto || editando || !ultimoPaso) return;
    document
      .querySelector<HTMLInputElement>('.paso-deslizante[data-estado="actual"] input[type="text"]')
      ?.focus({ preventScroll: true });
  }, [abierto, editando, ultimoPaso]);

  async function manejarCrearCategoria(nombre: string) {
    const nueva = await onCrearCategoria(nombre, f.tipo);
    f.elegirCategoria(nueva.id, !editando);
    setCreandoCategoria(false);
  }

  // Tocar Salida/Entrada le quita el foco al monto y cierra el teclado:
  // al registrar uno nuevo se le devuelve, para seguir escribiendo.
  function cambiarTipo(tipo: Tipo) {
    f.cambiarTipo(tipo);
    if (editando) return;
    document.querySelector<HTMLInputElement>('[role="dialog"] input[inputmode="numeric"]')?.focus({ preventScroll: true });
  }

  async function manejarEliminar() {
    if (!onEliminar) return;
    setConfirmandoEliminar(false);
    await f.eliminar(onEliminar);
  }

  function continuar() {
    if (f.paso === 0 && !f.montoValido) return;
    f.irAlPaso(f.paso + 1);
  }

  const categoria = categorias.find((c) => c.id === f.categoriaId);
  const montoNumero = Number(f.monto);
  const hoy = fechaLocalISO(new Date());
  const ayerFecha = new Date();
  ayerFecha.setDate(ayerFecha.getDate() - 1);
  const ayer = fechaLocalISO(ayerFecha);

  const selectorTipo = (
    <SelectorVidrio>
      <OpcionSelector active={f.tipo === 'egreso'} onClick={() => cambiarTipo('egreso')}>
        Salida
      </OpcionSelector>
      <OpcionSelector active={f.tipo === 'ingreso'} onClick={() => cambiarTipo('ingreso')}>
        Entrada
      </OpcionSelector>
    </SelectorVidrio>
  );

  const campoMonto = (
    <CampoMonto
      valor={f.monto}
      onCambiar={f.setMonto}
      tono={f.tipo}
      autoFocus={!editando}
      enterKeyHint={editando ? 'done' : 'next'}
      onEnter={editando ? undefined : continuar}
    />
  );

  const selectorCategoria = (
    <SelectorCategoria
      categorias={f.categoriasDelTipo}
      estaElegida={(id) => id === f.categoriaId}
      onElegir={(id) => f.elegirCategoria(id, !editando)}
      onNueva={() => setCreandoCategoria(true)}
    />
  );

  const camposDetalle = (
    <List strong inset className="mt-5 mb-3">
      <CampoTexto
        etiqueta="Descripción"
        valor={f.item}
        onCambiar={f.setItem}
        placeholder="Almuerzo, Uber, Salario…"
        enterKeyHint={editando ? 'done' : 'go'}
        onEnter={editando ? undefined : f.guardar}
      />
      {/* La fecha decide en qué mes cuenta el movimiento: se puede registrar
          hoy algo que pasó otro día (el gasto del 31 de octubre anotado el 9). */}
      <CampoTexto etiqueta="Fecha" type="date" valor={f.dia} onCambiar={f.setDia} />
    </List>
  );

  const atajosFecha = (
    <div className="flex gap-2 px-4">
      <ChipOpcion activo={f.dia === hoy} onClick={() => f.setDia(hoy)}>
        Hoy
      </ChipOpcion>
      <ChipOpcion activo={f.dia === ayer} onClick={() => f.setDia(ayer)}>
        Ayer
      </ChipOpcion>
    </div>
  );

  const mensajeError = f.error && (
    <p className="m-0 text-center text-[15px] text-alerta" role="alert">
      {f.error}
    </p>
  );

  const botonEliminar = editando && onEliminar && (
    <Button large rounded clear className="text-alerta" onClick={() => setConfirmandoEliminar(true)} disabled={f.guardando}>
      Eliminar movimiento
    </Button>
  );

  const pasos = [
    {
      clave: 'monto',
      titulo: 'Monto',
      contenido: (
        <div className="pb-2">
          <Encabezado>¿Cuánto fue?</Encabezado>
          <div className="px-4">{selectorTipo}</div>
          <div className="px-4 pt-5">{campoMonto}</div>
        </div>
      ),
    },
    {
      clave: 'categoria',
      titulo: 'Categoría',
      contenido: (
        <div className="pb-2">
          <Encabezado
            derecha={
              <span className={`text-[17px] font-semibold cifras ${f.tipo === 'ingreso' ? 'text-ingreso' : 'text-secundario'}`}>
                {f.tipo === 'ingreso' ? '+' : '−'}
                {formatearMonto(montoNumero)}
              </span>
            }
          >
            {f.tipo === 'egreso' ? '¿En qué se fue?' : '¿De dónde vino?'}
          </Encabezado>
          {selectorCategoria}
        </div>
      ),
    },
    {
      clave: 'detalle',
      titulo: 'Detalle',
      contenido: (
        <div className="pb-2">
          <Encabezado>Ponle nombre y fecha</Encabezado>
          <ResumenMovimiento
            tipo={f.tipo}
            monto={montoNumero}
            categoria={categoria}
            onCambiarCategoria={() => f.irAlPaso(1)}
            onCambiarMonto={() => f.irAlPaso(0)}
          />
          {camposDetalle}
          {atajosFecha}
        </div>
      ),
    },
  ];

  return (
    <>
      <HojaInferior
        abierto={abierto}
        titulo={editando ? 'Editar movimiento' : 'Nuevo movimiento'}
        onCerrar={onCerrar}
        cierreBloqueado={f.guardando}
        onAtras={!editando && f.paso > 0 ? () => f.irAlPaso(f.paso - 1) : undefined}
        reiniciarScroll={f.paso}
        cabecera={
          editando ? (
            <div className="flex flex-col gap-3 px-4 pb-3">
              {selectorTipo}
              {campoMonto}
            </div>
          ) : (
            <ProgresoPasos paso={f.paso} etiquetas={PASOS_MOVIMIENTO} descripcion="Progreso del movimiento" />
          )
        }
        pie={
          <>
            {mensajeError}
            <Button
              large
              rounded
              onClick={editando || ultimoPaso ? f.guardar : continuar}
              disabled={f.guardando || (!editando && f.paso === 0 && !f.montoValido)}
            >
              {f.guardando ? 'Guardando…' : editando || ultimoPaso ? 'Guardar' : 'Continuar'}
            </Button>
            {botonEliminar}
          </>
        }
      >
        {editando ? (
          <>
            <BlockTitle className="mt-2">Categoría</BlockTitle>
            {selectorCategoria}
            {camposDetalle}
            {atajosFecha}
          </>
        ) : (
          <PasosDeslizantes paso={f.paso} pasos={pasos} />
        )}
      </HojaInferior>

      <NuevaCategoriaSheet
        abierto={creandoCategoria}
        tipo={f.tipo}
        onCerrar={() => setCreandoCategoria(false)}
        onCrear={manejarCrearCategoria}
      />

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo="¿Eliminar movimiento?"
        mensaje="Se quitará de tu historial y de los totales del mes. No se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={manejarEliminar}
        onCancelar={() => setConfirmandoEliminar(false)}
      />
    </>
  );
}
