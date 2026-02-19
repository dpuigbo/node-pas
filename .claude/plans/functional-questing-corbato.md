# Plan: Commit y verificar deploy automático en Hostinger

## Contexto
La app PAS Robotics Manage ha estado fallando con 503 en cada auto-deploy de Hostinger. Después de múltiples intentos, hemos resuelto los problemas:

1. **Permisos binarios**: Hostinger pierde permisos de ejecución en `node_modules/.bin/*` tras cada `npm install`. Solucionado con `chmod +x` en `postinstall` y `build:client`.
2. **Compilación TypeScript eliminada**: En vez de compilar con `tsc` (que también tenía problemas de permisos), ahora usamos `tsx` para ejecutar TypeScript directamente en runtime.
3. **Variables de entorno**: Passenger no recibe las env vars configuradas en el panel de Hostinger. Solucionado añadiendo `dotenv` con ruta absoluta en `app.js`.
4. **`.htaccess`**: Committed al repo para que apunte siempre a `app.js`.

## Estado actual
- La app **funciona** en el servidor (verificado con `curl localhost:3000/api/health`)
- Archivos modificados pendientes de commit:
  - `app.js` — usa dotenv + tsx para ejecutar TS directamente
  - `package.json` — build simplificado (solo client + prisma), chmod en postinstall
  - `src/index.ts` — ruta de static files corregida para modo sin compilación
  - `.htaccess` — nuevo archivo para Passenger

## Plan

### Paso 1: Commit y push
Hacer commit de los 4 archivos modificados y push a main para trigger del auto-deploy.

### Paso 2: Verificar deploy
Después del deploy, verificar que `https://admin.pasrobotics.com/api/health` responde correctamente sin intervención manual por SSH.

### Verificación
- Abrir `https://admin.pasrobotics.com/api/health` → debe devolver `{"status":"ok",...}`
- Abrir `https://admin.pasrobotics.com/` → debe mostrar el dashboard
