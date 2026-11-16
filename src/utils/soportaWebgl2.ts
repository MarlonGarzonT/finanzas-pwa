// ¿Puede este navegador dibujar WebGL2? Los fondos con shader (Aurora) lo
// consultan antes de montar el canvas: sin WebGL2 Chrome pinta un recuadro con
// una carita triste. Se libera el contexto de prueba al terminar.
export function soportaWebgl2(): boolean {
  try {
    const contexto = document.createElement('canvas').getContext('webgl2');
    contexto?.getExtension('WEBGL_lose_context')?.loseContext();
    return contexto !== null;
  } catch {
    return false;
  }
}
