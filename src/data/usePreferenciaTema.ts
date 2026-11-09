import { useState } from 'react';
import { aplicarTema, guardarPreferenciaTema, leerPreferenciaTema, type PreferenciaTema } from '../utils/tema';

// Apariencia elegida en el perfil: Automático (sigue al sistema), Claro u
// Oscuro. Se guarda en el teléfono, no en la cuenta.
export function usePreferenciaTema(): [PreferenciaTema, (preferencia: PreferenciaTema) => void] {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(leerPreferenciaTema);

  function cambiar(nueva: PreferenciaTema) {
    setPreferencia(nueva);
    guardarPreferenciaTema(nueva);
    aplicarTema(nueva);
  }

  return [preferencia, cambiar];
}
