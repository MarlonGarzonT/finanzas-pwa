import type { Perfil } from '../data/usePerfil';
import { AvatarUsuario } from './AvatarUsuario';
import { IconoCorreo } from './Iconos';
import StarBorder from './reactbits/StarBorder';
import { useEsOscuro } from './useEsOscuro';

// Avatar de 96px + 4px de aire a cada lado: el anillo queda en 104px y con
// radio 52 el contorno de StarBorder es un círculo.
const RADIO_ANILLO = 52;

// Verdes azulados del logo de Mi Cuadre: la luz más intensa en la cabeza y el
// rastro en el tono medio. En oscuro, más claros para que brillen sobre negro.
const ANILLO = {
  claro: { luz: '#138a77', rastro: '#43af9c', pista: 'rgb(67 175 156 / 0.28)' },
  oscuro: { luz: '#7ee0c4', rastro: '#43af9c', pista: 'rgb(67 175 156 / 0.35)' },
};

// Cabecera al estilo de la cuenta de Apple en Ajustes: foto grande, nombre,
// correo y con qué se inicia sesión.
export function CabeceraPerfil({ perfil }: { perfil: Perfil }) {
  const oscuro = useEsOscuro();
  const colores = oscuro ? ANILLO.oscuro : ANILLO.claro;
  return (
    <header className="aparecer-suave flex flex-col items-center gap-1 px-6 pt-4 text-center">
      {/* Una estrella de luz le da la vuelta al avatar cada 6 s, con los
          colores del logo; al tocarlo sale un pulso por el anillo. Con
          "reducir movimiento" la estrella queda quieta. */}
      <StarBorder
        as="div"
        theme={oscuro ? 'dark' : 'light'}
        radius={RADIO_ANILLO}
        // En claro la luz es más tenue (StarBorder no usa brillo aditivo):
        // un trazo algo más grueso la hace visible sobre el gris.
        thickness={oscuro ? 1.5 : 2}
        duration={6}
        trailLength={0.35}
        glow={0.55}
        sparkle
        hover="none"
        color={colores.luz}
        trailColor={colores.rastro}
        borderColor={colores.pista}
        backgroundColor="transparent"
        style={{ padding: 4 }}
      >
        <AvatarUsuario nombre={perfil.nombre} fotoUrl={perfil.fotoUrl} className="size-24 text-3xl" />
      </StarBorder>
      <h1 className="m-0 mt-3 max-w-full truncate text-[24px] leading-tight font-bold tracking-tight">{perfil.nombre}</h1>
      <p className="m-0 max-w-full truncate text-[15px] text-secundario">{perfil.correo}</p>
      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1 text-[13px] font-medium dark:bg-white/10">
        {perfil.metodo === 'google' ? (
          <>
            <LogoGoogle />
            Cuenta de Google
          </>
        ) : (
          <>
            <IconoCorreo className="size-4" />
            Correo y contraseña
          </>
        )}
      </span>
    </header>
  );
}

function LogoGoogle() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.8-.4-4.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.6 26.7 37.5 24 37.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 40.6 16.2 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C39.9 37 45 32.1 45 24c0-1.4-.1-2.8-.4-4.5z" />
    </svg>
  );
}
