import { nombreMes, sumarMeses } from '../utils/fechas';
import './SelectorMes.css';

interface Props {
  mes: Date;
  onCambiar: (mes: Date) => void;
}

// text-transform:capitalize pondría mayúscula en cada palabra ("Septiembre
// De 2026"); esto solo capitaliza la primera letra ("Septiembre de 2026").
function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function SelectorMes({ mes, onCambiar }: Props) {
  return (
    <div className="selector-mes">
      <button
        type="button"
        className="selector-mes__flecha"
        onClick={() => onCambiar(sumarMeses(mes, -1))}
        aria-label="Mes anterior"
      >
        ‹
      </button>
      <span className="selector-mes__etiqueta">{capitalizarPrimera(nombreMes(mes))}</span>
      <button
        type="button"
        className="selector-mes__flecha"
        onClick={() => onCambiar(sumarMeses(mes, 1))}
        aria-label="Mes siguiente"
      >
        ›
      </button>
    </div>
  );
}
