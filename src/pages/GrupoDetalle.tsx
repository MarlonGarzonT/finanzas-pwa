import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AvatarMiembro } from '../components/AvatarMiembro';
import { NuevoGastoGrupoSheet } from '../components/NuevoGastoGrupoSheet';
import { RegistrarPagoSheet } from '../components/RegistrarPagoSheet';
import { Spinner } from '../components/Spinner';
import { useGrupos } from '../data/GruposContext';
import { useGrupoDetalle } from '../data/useGrupoDetalle';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import { calcularBalances, simplificarDeudas, type DeudaSugerida } from '../utils/saldosGrupo';
import './GrupoDetalle.css';

export function GrupoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const miId = session?.user.id;
  const { grupos } = useGrupos();
  const { miembros, gastos, partes, pagos, cargando, agregarGasto, eliminarGasto, registrarPago } = useGrupoDetalle(id);
  const [gastoAbierto, setGastoAbierto] = useState(false);
  const [pagoSugerido, setPagoSugerido] = useState<DeudaSugerida | null>(null);

  const grupo = grupos.find((g) => g.id === id);

  const nombreDe = useMemo(() => {
    const mapa = new Map(miembros.map((m) => [m.userId, m.nombreVisible]));
    return (userId: string) => (userId === miId ? 'Tú' : mapa.get(userId) ?? 'Alguien');
  }, [miembros, miId]);

  const balances = useMemo(() => calcularBalances(gastos, partes, pagos), [gastos, partes, pagos]);
  const deudas = useMemo(() => simplificarDeudas(balances), [balances]);

  const partesPorGasto = useMemo(() => {
    const mapa = new Map<string, typeof partes>();
    for (const parte of partes) {
      const lista = mapa.get(parte.gastoId) ?? [];
      lista.push(parte);
      mapa.set(parte.gastoId, lista);
    }
    return mapa;
  }, [partes]);

  if (cargando) {
    return (
      <div className="grupo-detalle grupo-detalle--cargando">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grupo-detalle">
      <header className="grupo-detalle__header">
        <button className="grupo-detalle__atras" onClick={() => navigate('/grupos')} aria-label="Volver a grupos">
          ‹
        </button>
        <h1 className="grupo-detalle__titulo">{grupo?.nombre ?? 'Grupo'}</h1>
      </header>

      <div className="grupo-detalle__contenido">
        <div className="grupo-detalle__miembros">
          {miembros.map((m) => (
            <div key={m.userId} className="grupo-detalle__miembro">
              <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
              <span>{m.userId === miId ? 'Tú' : m.nombreVisible}</span>
            </div>
          ))}
        </div>

        <section className="grupo-detalle__saldos">
          <h2>Saldos</h2>
          {deudas.length === 0 ? (
            <p className="grupo-detalle__vacio">Todo está saldado. Nadie le debe nada a nadie.</p>
          ) : (
            <ul>
              {deudas.map((d, i) => (
                <li key={i} className="saldo-fila">
                  <span className="saldo-fila__texto">
                    {d.de === miId ? (
                      <>
                        Le debes a <strong>{nombreDe(d.a)}</strong>
                      </>
                    ) : d.a === miId ? (
                      <>
                        <strong>{nombreDe(d.de)}</strong> te debe
                      </>
                    ) : (
                      <>
                        <strong>{nombreDe(d.de)}</strong> le debe a <strong>{nombreDe(d.a)}</strong>
                      </>
                    )}
                  </span>
                  <span className="saldo-fila__monto">{formatearMonto(d.monto)}</span>
                  {(d.de === miId || d.a === miId) && (
                    <button className="saldo-fila__accion" onClick={() => setPagoSugerido(d)}>
                      Registrar pago
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grupo-detalle__gastos">
          <h2>Gastos</h2>
          {gastos.length === 0 ? (
            <p className="grupo-detalle__vacio">Aún no hay gastos registrados en este grupo.</p>
          ) : (
            <ul>
              {gastos.map((gasto) => {
                const partesDelGasto = partesPorGasto.get(gasto.id) ?? [];
                return (
                  <li key={gasto.id} className="gasto-fila">
                    <AvatarMiembro id={gasto.pagadoPor} nombre={nombreDe(gasto.pagadoPor)} />
                    <div className="gasto-fila__detalle">
                      <span className="gasto-fila__descripcion">{gasto.descripcion}</span>
                      <span className="gasto-fila__meta">
                        Pagó {nombreDe(gasto.pagadoPor)} · {formatearFechaCorta(gasto.fecha)} · dividido entre{' '}
                        {partesDelGasto.length}
                      </span>
                    </div>
                    <span className="gasto-fila__monto">{formatearMonto(gasto.monto)}</span>
                    {gasto.creadoPor === miId && (
                      <button
                        className="gasto-fila__eliminar"
                        onClick={() => eliminarGasto(gasto.id)}
                        aria-label="Eliminar gasto"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <button className="fab" onClick={() => setGastoAbierto(true)} aria-label="Nuevo gasto">
        +
      </button>

      {id && (
        <NuevoGastoGrupoSheet
          abierto={gastoAbierto}
          grupoId={id}
          miembros={miembros}
          miId={miId ?? ''}
          onCerrar={() => setGastoAbierto(false)}
          onAgregar={agregarGasto}
        />
      )}

      {id && (
        <RegistrarPagoSheet
          abierto={pagoSugerido !== null}
          miembros={miembros}
          sugerencia={pagoSugerido}
          onCerrar={() => setPagoSugerido(null)}
          onRegistrar={async (de, a, monto) => {
            await registrarPago(de, a, monto);
            setPagoSugerido(null);
          }}
        />
      )}
    </div>
  );
}
