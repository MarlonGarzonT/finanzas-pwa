import { ListInput } from 'konsta/react';
import { useId, type HTMLInputAutoCompleteAttribute, type ReactNode } from 'react';

interface Props {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search' | 'date';
  inputMode?: 'text' | 'numeric' | 'email' | 'search';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoCapitalize?: 'off' | 'sentences' | 'words' | 'characters';
  enterKeyHint?: 'done' | 'next' | 'go' | 'search' | 'send';
  autoFocus?: boolean;
  // Enter en el teclado (ej. guardar al terminar la descripción).
  onEnter?: () => void;
  required?: boolean;
  // Solo para type="date": día mínimo, 'AAAA-MM-DD'.
  min?: string;
  // Campo de cifras: solo deja dígitos y teclado numérico. Con 'monto' se
  // muestra con separador de miles (el valor que sube sigue siendo solo dígitos).
  numerico?: 'monto' | 'entero';
  // Botón al final del campo (ej. mostrar/ocultar contraseña).
  accion?: ReactNode;
}

// Fila de formulario de Konsta (ListInput) con el <input> propio: el de
// Konsta dibuja la etiqueta como un <div> suelto, sin asociarla al campo, y
// no deja pasar enterkeyhint. Aquí la etiqueta es un <label> real.
export function CampoTexto({
  etiqueta,
  valor,
  onCambiar,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete = 'off',
  autoCapitalize = 'sentences',
  enterKeyHint = 'done',
  autoFocus,
  onEnter,
  required,
  min,
  numerico,
  accion,
}: Props) {
  const id = useId();
  return (
    <ListInput
      label={<label htmlFor={id}>{etiqueta}</label>}
      input={
        <div className="flex items-center">
          <input
            id={id}
            type={type}
            value={numerico === 'monto' && valor ? Number(valor).toLocaleString('es-CO') : valor}
            onChange={(e) => onCambiar(numerico ? e.target.value.replace(/\D/g, '') : e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault();
                onEnter();
              }
            }}
            placeholder={placeholder}
            inputMode={numerico ? 'numeric' : inputMode}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize}
            enterKeyHint={enterKeyHint}
            autoFocus={autoFocus}
            required={required}
            min={min}
            className="block h-11 w-full appearance-none bg-transparent text-[17px] placeholder-black/55 focus:outline-none dark:placeholder-white/50"
          />
          {accion}
        </div>
      }
    />
  );
}
