import { useEffect, useState } from 'react';
import type { FijoVariable } from '../utils/estadisticasMes';
import { formatearMonto } from '../utils/fechas';
import './BarraFijoVariable.css';

export function BarraFijoVariable({ fijo, variable, porcentajeFijo }: FijoVariable) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (fijo + variable === 0) {
    return <p className="grafico-card__vacio">Nada que mostrar todavía.</p>;
  }

  return (
    <div className="barra-fijo-variable">
      <div className="barra-fijo-variable__pista">
        <div
          className="barra-fijo-variable__fijo"
          style={{ width: montado ? `${porcentajeFijo}%` : '0%' }}
        />
      </div>
      <div className="barra-fijo-variable__leyenda">
        <span className="barra-fijo-variable__item">
          <span className="barra-fijo-variable__punto barra-fijo-variable__punto--fijo" aria-hidden />
          📌 Fijo · {formatearMonto(fijo)}
        </span>
        <span className="barra-fijo-variable__item">
          <span className="barra-fijo-variable__punto barra-fijo-variable__punto--variable" aria-hidden />
          Variable · {formatearMonto(variable)}
        </span>
      </div>
    </div>
  );
}
