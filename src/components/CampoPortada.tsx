import { useId, type HTMLInputAutoCompleteAttribute, type ReactNode } from 'react';

interface Props {
  etiqueta: string;
  icono: ReactNode;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  inputMode?: 'text' | 'email';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  enterKeyHint?: 'done' | 'next' | 'go';
  required?: boolean;
  // Botón al final del campo (mostrar/ocultar contraseña).
  accion?: ReactNode;
}

// Campo de las pantallas de acceso (login y registro): cada uno es su propia
// tarjeta con ícono, etiqueta pequeña arriba y un aro azul al enfocar. Los
// formularios de dentro de la app siguen con CampoTexto (filas de lista iOS).
// Toda la tarjeta es el <label>: tocar en cualquier parte enfoca el campo.
// El aro es una capa aparte que solo cambia de opacidad.
export function CampoPortada({
  etiqueta,
  icono,
  valor,
  onCambiar,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete = 'off',
  enterKeyHint = 'done',
  required,
  accion,
}: Props) {
  const id = useId();
  return (
    <div className="group relative flex h-16 items-center rounded-[20px] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.18)] ring-1 ring-black/[0.06] dark:bg-[#1c1c1e] dark:shadow-none dark:ring-white/10">
      <span
        className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 shadow-[0_0_0_2px_var(--color-primary),0_0_0_6px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition-opacity duration-200 group-focus-within:opacity-100"
        aria-hidden="true"
      />
      <label htmlFor={id} className="flex h-full min-w-0 flex-1 cursor-text items-center gap-3 pl-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-secundario transition-colors duration-200 group-focus-within:bg-primary/12 group-focus-within:text-primary dark:bg-white/10"
          aria-hidden="true"
        >
          {icono}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] leading-tight font-medium text-secundario">{etiqueta}</span>
          <input
            id={id}
            type={type}
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            autoCapitalize="off"
            enterKeyHint={enterKeyHint}
            required={required}
            className="block h-7 w-full appearance-none bg-transparent text-[17px] placeholder-black/45 autofill:shadow-[inset_0_0_0_1000px_#fff] focus:outline-none dark:placeholder-white/40 dark:autofill:shadow-[inset_0_0_0_1000px_#1c1c1e] dark:autofill:[-webkit-text-fill-color:#fff]"
          />
        </span>
      </label>
      {accion ? <span className="relative pr-3">{accion}</span> : <span className="w-4" />}
    </div>
  );
}
