export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

const CLAVE = 'finanzas-pwa:tema';
const consultaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

export function leerPreferenciaTema(): PreferenciaTema {
  try {
    const guardada = localStorage.getItem(CLAVE);
    return guardada === 'claro' || guardada === 'oscuro' ? guardada : 'sistema';
  } catch {
    // Sin almacenamiento (modo privado): se sigue al sistema.
    return 'sistema';
  }
}

export function guardarPreferenciaTema(preferencia: PreferenciaTema): void {
  try {
    if (preferencia === 'sistema') localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, preferencia);
  } catch {
    // Sin almacenamiento: el cambio dura hasta cerrar la app.
  }
}

// Konsta activa su modo oscuro con la clase `dark` en un ancestro, no con la
// media query. theme-color va al mismo color del fondo para que la barra del
// navegador y la de estado no se vean como una franja aparte.
export function aplicarTema(preferencia: PreferenciaTema): void {
  const oscuro = preferencia === 'oscuro' || (preferencia === 'sistema' && consultaOscuro.matches);
  document.documentElement.classList.toggle('dark', oscuro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#000000' : '#f2f2f7');
}

// Se llama antes del primer render, para que no haya un destello claro al
// abrir de noche, y sigue los cambios del sistema mientras la preferencia
// sea "sistema".
export function iniciarTema(): void {
  aplicarTema(leerPreferenciaTema());
  consultaOscuro.addEventListener('change', () => aplicarTema(leerPreferenciaTema()));
}
