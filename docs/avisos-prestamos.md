# Avisos push de préstamos vencidos

Cómo funciona: una tarea diaria de la base (pg_cron) llama a la Edge Function
`avisar-prestamos-vencidos`. La función busca préstamos con saldo cuya fecha de
pago ya pasó y envía un aviso push a los teléfonos de esa persona. Avisa el día
después de la fecha y luego cada semana mientras no le paguen.

En iPhone los avisos solo llegan con la app agregada a la pantalla de inicio
(iOS 16.4 o más reciente). En Android y en computador funcionan desde el navegador.

## 1. Base de datos

Correr en el SQL Editor el bloque "Préstamos" del final de `supabase/schema.sql`.

## 2. Claves VAPID

Identifican a tu servidor ante los servicios de push. Se generan una sola vez:

```bash
npx web-push generate-vapid-keys
```

- La **Public Key** va en el código, en `CLAVE_PUBLICA_VAPID`
  (`src/data/notificacionesPush.ts`). Es pública por diseño: cada navegador la
  recibe al suscribirse.
- La **Private Key** va **solo** en los secrets de la Edge Function (paso 3).
  Nunca en el frontend ni en el repositorio.
- Si cambias una, cambia la otra: las suscripciones existentes dejan de servir
  y cada dispositivo tiene que volver a activar los avisos.

## 3. Edge Function

Con la CLI de Supabase (desde la carpeta del proyecto):

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF

# Un secreto al azar para que solo el cron pueda llamar la función:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npx supabase secrets set \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:tu-correo@ejemplo.com \
  CRON_SECRET=el-secreto-generado

npx supabase functions deploy avisar-prestamos-vencidos --no-verify-jwt
```

`--no-verify-jwt` es a propósito: la llama el cron, no una sesión. La función
exige en su lugar el encabezado `x-cron-secret`.

Sin la CLI: en el dashboard, Edge Functions → Deploy a new function → pegar
`supabase/functions/avisar-prestamos-vencidos/index.ts`, apagar "Enforce JWT
verification" y cargar los cuatro secrets en Edge Functions → Secrets.

## 4. Tarea diaria (9:00 a. m. de Colombia = 14:00 UTC)

En el dashboard, Database → Extensions: activar `pg_cron` y `pg_net`. Luego, en
el SQL Editor (cambia TU_PROJECT_REF y el secreto):

```sql
select vault.create_secret(
  'https://TU_PROJECT_REF.supabase.co/functions/v1/avisar-prestamos-vencidos',
  'url_avisar_prestamos'
);
select vault.create_secret('el-secreto-generado', 'cron_secret_prestamos');

select cron.schedule(
  'avisar-prestamos-vencidos',
  '0 14 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_avisar_prestamos'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret_prestamos')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## 5. Probar

1. En la app publicada (o `npm run build && npm run preview`), activar
   "Avisarme si no me pagan" en la pestaña Préstamos y aceptar el permiso.
2. Registrar un préstamo de prueba y, en el SQL Editor, ponerle una fecha pasada:
   `update prestamos set fecha_devolucion = current_date - 2 where persona = 'PRUEBA';`
3. Llamar la función a mano:

   ```bash
   curl -X POST https://TU_PROJECT_REF.supabase.co/functions/v1/avisar-prestamos-vencidos \
     -H "x-cron-secret: el-secreto-generado"
   ```

   Debe responder algo como `{"usuarios":1,"enviados":1,"fallidos":0,"limpiadas":0}`
   y llegar el aviso. Una segunda llamada no envía nada (espera una semana).
4. Para repetir la prueba: `update prestamos set ultimo_aviso = null where persona = 'PRUEBA';`

Los registros de cada ejecución quedan en Edge Functions → avisar-prestamos-vencidos → Logs.
