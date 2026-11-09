import { ListInput } from 'konsta/react';
import { useId, type HTMLInputAutoCompleteAttribute, type ReactNode } from 'react';

interface Props {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  inputMode?: 'text' | 'numeric' | 'email' | 'search';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoCapitalize?: 'off' | 'sentences' | 'words' | 'characters';
  enterKeyHint?: 'done' | 'next' | 'go' | 'search' | 'send';
  autoFocus?: boolean;
  required?: boolean;
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
  required,
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
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize}
            enterKeyHint={enterKeyHint}
            autoFocus={autoFocus}
            required={required}
            className="block h-11 w-full appearance-none bg-transparent text-[17px] placeholder-black/55 focus:outline-none dark:placeholder-white/50"
          />
          {accion}
        </div>
      }
    />
  );
}
